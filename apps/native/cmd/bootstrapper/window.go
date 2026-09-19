//go:build windows

package main

import (
	_ "embed"
	"math"
	"syscall"
	"unsafe"
)

//go:embed satoshi.ttf
var satoshiTTF []byte

const fontFace = "Satoshi"

const (
	windowWidth  = 720
	windowHeight = 240
	cornerRadius = 28

	spinnerRadius    = 22
	spinnerThickness = 4
	spinnerSweepDeg  = 100
)

type installState int

const (
	stateInstalling installState = iota
	stateSuccess
	stateError
)

type appState struct {
	hwnd         syscall.Handle
	angle        float64
	state        installState
	lang         string
	version      string
	brushBg      syscall.Handle
	fontTitle    syscall.Handle
	fontSubtitle syscall.Handle
	fontGlyph    syscall.Handle
	fontVersion  syscall.Handle
	onEscape     func()
}

var app *appState

const (
	timerSpin    = 1
	timerClose   = 2
	spinnerMs    = 16
	closeDelayMs = 1500
)

// White CTA-bubble variant (Tailwind `.dark` token values from
// apps/web/app/globals.css: --cta-surface/--cta-ink/--cta-muted, and the
// light-theme --primary for a spinner accent that reads on a light card).
var (
	colBg     = rgb(0xe4, 0xf2, 0xff)
	colInk    = rgb(0x07, 0x07, 0x07)
	colMuted  = rgb(0x1f, 0x22, 0x25)
	colAccent = rgb(0x08, 0x91, 0xb2)
)

func createWindow() (syscall.Handle, error) {
	hInstance, _, _ := procGetModuleHandleW.Call(0)

	className := mustUTF16Ptr("NowlyBootstrapperWindow")
	wndProcCb := syscall.NewCallback(wndProc)

	cursor, _, _ := procLoadCursorW.Call(0, uintptr(idcArrow))

	wc := wndClassEx{
		style:         0,
		lpfnWndProc:   wndProcCb,
		hInstance:     syscall.Handle(hInstance),
		hCursor:       syscall.Handle(cursor),
		lpszClassName: className,
	}
	wc.cbSize = uint32(unsafe.Sizeof(wc))

	atom, _, _ := procRegisterClassExW.Call(uintptr(unsafe.Pointer(&wc)))
	if atom == 0 {
		return 0, syscall.GetLastError()
	}

	screenW, _, _ := procGetSystemMetrics.Call(uintptr(smCxScreen))
	screenH, _, _ := procGetSystemMetrics.Call(uintptr(smCyScreen))
	x := (int32(screenW) - windowWidth) / 2
	y := (int32(screenH) - windowHeight) / 2

	title := mustUTF16Ptr("Nowly")

	hwnd, _, _ := procCreateWindowExW.Call(
		0,
		uintptr(unsafe.Pointer(className)),
		uintptr(unsafe.Pointer(title)),
		uintptr(wsPopup|wsVisible|wsClipChildren),
		uintptr(x), uintptr(y),
		uintptr(windowWidth), uintptr(windowHeight),
		0, 0,
		hInstance,
		0,
	)
	if hwnd == 0 {
		return 0, syscall.GetLastError()
	}

	rgn, _, _ := procCreateRoundRectRgn.Call(0, 0, uintptr(windowWidth), uintptr(windowHeight), uintptr(cornerRadius*2), uintptr(cornerRadius*2))
	procSetWindowRgn.Call(hwnd, rgn, 1)

	return syscall.Handle(hwnd), nil
}

func initGDIObjects() {
	registerEmbeddedFont(satoshiTTF)

	face := fontFaceFor(app.lang)

	brush, _, _ := procCreateSolidBrush.Call(colBg)
	app.brushBg = syscall.Handle(brush)
	app.fontTitle = createFont(-30, fwNormal, face)
	app.fontSubtitle = createFont(-16, fwNormal, face)
	app.fontGlyph = createFont(-34, fwBold, "Segoe UI")
	app.fontVersion = createFont(-13, fwNormal, face)
}

// registerEmbeddedFont loads a TTF from memory as a process-private font
// (no install, no admin rights) so CreateFontW can address it by family
// name. Best-effort: on failure CreateFontW just falls back to a system font.
func registerEmbeddedFont(ttf []byte) {
	if len(ttf) == 0 {
		return
	}
	var numFonts uint32
	procAddFontMemResourceEx.Call(
		uintptr(unsafe.Pointer(&ttf[0])),
		uintptr(len(ttf)),
		0,
		uintptr(unsafe.Pointer(&numFonts)),
	)
}

func createFont(height, weight int32, face string) syscall.Handle {
	facePtr := mustUTF16Ptr(face)
	h, _, _ := procCreateFontW.Call(
		uintptr(height), 0, 0, 0,
		uintptr(weight),
		0, 0, 0,
		uintptr(defaultCharset),
		uintptr(outTTPrecis),
		uintptr(clipDefaultPrecis),
		uintptr(clearTypeQuality),
		uintptr(varPitch),
		uintptr(unsafe.Pointer(facePtr)),
	)
	return syscall.Handle(h)
}

func runMessageLoop() {
	var m msg
	for {
		ret, _, _ := procGetMessageW.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if int32(ret) <= 0 {
			return
		}
		procTranslateMessage.Call(uintptr(unsafe.Pointer(&m)))
		procDispatchMessageW.Call(uintptr(unsafe.Pointer(&m)))
	}
}

func wndProc(hwnd syscall.Handle, message uint32, wparam, lparam uintptr) uintptr {
	switch message {
	case wmNCHitTest:
		hit, _, _ := procDefWindowProcW.Call(uintptr(hwnd), uintptr(message), wparam, lparam)
		if hit == htClient {
			return htCaption
		}
		return hit

	case wmEraseBkgnd:
		return 1

	case wmPaint:
		paint(hwnd)
		return 0

	case wmTimer:
		onTimer(hwnd, wparam)
		return 0

	case msgPayloadDone:
		onPayloadDone(hwnd, wparam)
		return 0

	case wmKeyDown:
		if wparam == vkEscape && app != nil && app.onEscape != nil {
			app.onEscape()
		}
		return 0

	case wmDestroy:
		procKillTimer.Call(uintptr(hwnd), uintptr(timerSpin))
		procKillTimer.Call(uintptr(hwnd), uintptr(timerClose))
		procPostQuitMessage.Call(0)
		return 0
	}

	ret, _, _ := procDefWindowProcW.Call(uintptr(hwnd), uintptr(message), wparam, lparam)
	return ret
}

func onTimer(hwnd syscall.Handle, timerID uintptr) {
	switch timerID {
	case timerSpin:
		app.angle += 6
		if app.angle >= 360 {
			app.angle -= 360
		}
		procInvalidateRect.Call(uintptr(hwnd), 0, 0)
	case timerClose:
		procKillTimer.Call(uintptr(hwnd), timerID)
		procDestroyWindow.Call(uintptr(hwnd))
	}
}

func onPayloadDone(hwnd syscall.Handle, wparam uintptr) {
	procKillTimer.Call(uintptr(hwnd), uintptr(timerSpin))
	if wparam == 0 {
		app.state = stateSuccess
	} else {
		app.state = stateError
	}
	procInvalidateRect.Call(uintptr(hwnd), 0, 0)
	procSetTimer.Call(uintptr(hwnd), uintptr(timerClose), uintptr(closeDelayMs), 0)
}

func paint(hwnd syscall.Handle) {
	var ps paintStruct
	hdc, _, _ := procBeginPaint.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&ps)))

	var client rect
	procGetClientRect.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&client)))
	procFillRect.Call(hdc, uintptr(unsafe.Pointer(&client)), uintptr(app.brushBg))

	procSetBkMode.Call(hdc, uintptr(transparent))

	title, subtitle := stateStrings(app.state, app.lang)

	titleRect := rect{48, 40, windowWidth - 48, 84}
	drawText(hdc, title, titleRect, app.fontTitle, colInk)

	subtitleRect := rect{48, 84, windowWidth - 48, 112}
	drawText(hdc, subtitle, subtitleRect, app.fontSubtitle, colMuted)

	cx, cy := int32(windowWidth/2), int32(172)
	switch app.state {
	case stateInstalling:
		drawSpinner(hdc, cx, cy, app.angle)
	case stateSuccess:
		drawGlyph(hdc, cx, cy, "✓")
	case stateError:
		drawGlyph(hdc, cx, cy, "×")
	}

	if app.version != "" {
		versionRect := rect{windowWidth - 120, windowHeight - 30, windowWidth - 16, windowHeight - 12}
		drawTextRight(hdc, "v"+app.version, versionRect, app.fontVersion, colMuted)
	}

	procEndPaint.Call(uintptr(hwnd), uintptr(unsafe.Pointer(&ps)))
}

func drawText(hdc uintptr, text string, r rect, font syscall.Handle, color uintptr) {
	prev, _, _ := procSelectObject.Call(hdc, uintptr(font))
	procSetTextColor.Call(hdc, color)
	ptr := mustUTF16Ptr(text)
	procDrawTextW.Call(hdc, uintptr(unsafe.Pointer(ptr)), ^uintptr(0), uintptr(unsafe.Pointer(&r)), uintptr(dtCenter|dtVcenter|dtSingleLine))
	procSelectObject.Call(hdc, prev)
}

func drawTextRight(hdc uintptr, text string, r rect, font syscall.Handle, color uintptr) {
	prev, _, _ := procSelectObject.Call(hdc, uintptr(font))
	procSetTextColor.Call(hdc, color)
	ptr := mustUTF16Ptr(text)
	procDrawTextW.Call(hdc, uintptr(unsafe.Pointer(ptr)), ^uintptr(0), uintptr(unsafe.Pointer(&r)), uintptr(dtRight|dtVcenter|dtSingleLine))
	procSelectObject.Call(hdc, prev)
}

func drawGlyph(hdc uintptr, cx, cy int32, glyph string) {
	r := rect{cx - spinnerRadius - 10, cy - spinnerRadius - 10, cx + spinnerRadius + 10, cy + spinnerRadius + 10}
	drawText(hdc, glyph, r, app.fontGlyph, colAccent)
}

func drawSpinner(hdc uintptr, cx, cy int32, startDeg float64) {
	pen, _, _ := procCreatePen.Call(uintptr(psSolid), uintptr(spinnerThickness), colAccent)
	prevPen, _, _ := procSelectObject.Call(hdc, pen)

	left, top := cx-spinnerRadius, cy-spinnerRadius
	right, bottom := cx+spinnerRadius, cy+spinnerRadius

	startRad := startDeg * math.Pi / 180
	endRad := (startDeg + spinnerSweepDeg) * math.Pi / 180

	xs := cx + int32(float64(spinnerRadius)*math.Cos(startRad))
	ys := cy - int32(float64(spinnerRadius)*math.Sin(startRad))
	xe := cx + int32(float64(spinnerRadius)*math.Cos(endRad))
	ye := cy - int32(float64(spinnerRadius)*math.Sin(endRad))

	procArc.Call(hdc, uintptr(left), uintptr(top), uintptr(right), uintptr(bottom), uintptr(xs), uintptr(ys), uintptr(xe), uintptr(ye))

	procSelectObject.Call(hdc, prevPen)
	procDeleteObject.Call(pen)
}

func stateStrings(s installState, lang string) (string, string) {
	switch s {
	case stateSuccess:
		return t(lang, "successTitle"), t(lang, "successSubtitle")
	case stateError:
		return t(lang, "errorTitle"), t(lang, "errorSubtitle")
	default:
		return t(lang, "installingTitle"), t(lang, "installingSubtitle")
	}
}
