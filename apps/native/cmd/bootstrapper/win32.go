//go:build windows

package main

import (
	"syscall"
)

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	gdi32    = syscall.NewLazyDLL("gdi32.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")

	procRegisterClassExW   = user32.NewProc("RegisterClassExW")
	procCreateWindowExW    = user32.NewProc("CreateWindowExW")
	procDefWindowProcW     = user32.NewProc("DefWindowProcW")
	procGetMessageW        = user32.NewProc("GetMessageW")
	procTranslateMessage   = user32.NewProc("TranslateMessage")
	procDispatchMessageW   = user32.NewProc("DispatchMessageW")
	procPostQuitMessage    = user32.NewProc("PostQuitMessage")
	procPostMessageW       = user32.NewProc("PostMessageW")
	procDestroyWindow      = user32.NewProc("DestroyWindow")
	procShowWindow         = user32.NewProc("ShowWindow")
	procUpdateWindow       = user32.NewProc("UpdateWindow")
	procBeginPaint         = user32.NewProc("BeginPaint")
	procEndPaint           = user32.NewProc("EndPaint")
	procGetClientRect      = user32.NewProc("GetClientRect")
	procInvalidateRect     = user32.NewProc("InvalidateRect")
	procSetWindowRgn       = user32.NewProc("SetWindowRgn")
	procGetSystemMetrics   = user32.NewProc("GetSystemMetrics")
	procSetTimer           = user32.NewProc("SetTimer")
	procKillTimer          = user32.NewProc("KillTimer")
	procLoadCursorW        = user32.NewProc("LoadCursorW")
	procFillRect           = user32.NewProc("FillRect")
	procDrawTextW          = user32.NewProc("DrawTextW")
	procSetProcessDPIAware = user32.NewProc("SetProcessDPIAware")
	procLoadImageW         = user32.NewProc("LoadImageW")
	procSendMessageW       = user32.NewProc("SendMessageW")

	procCreateRoundRectRgn   = gdi32.NewProc("CreateRoundRectRgn")
	procCreateSolidBrush     = gdi32.NewProc("CreateSolidBrush")
	procCreatePen            = gdi32.NewProc("CreatePen")
	procSelectObject         = gdi32.NewProc("SelectObject")
	procDeleteObject         = gdi32.NewProc("DeleteObject")
	procSetTextColor         = gdi32.NewProc("SetTextColor")
	procSetBkMode            = gdi32.NewProc("SetBkMode")
	procArc                  = gdi32.NewProc("Arc")
	procCreateFontW          = gdi32.NewProc("CreateFontW")
	procAddFontMemResourceEx = gdi32.NewProc("AddFontMemResourceEx")

	procGetModuleHandleW         = kernel32.NewProc("GetModuleHandleW")
	procGetUserDefaultLocaleName = kernel32.NewProc("GetUserDefaultLocaleName")
)

type point struct{ X, Y int32 }

type rect struct{ Left, Top, Right, Bottom int32 }

type wndClassEx struct {
	cbSize        uint32
	style         uint32
	lpfnWndProc   uintptr
	cbClsExtra    int32
	cbWndExtra    int32
	hInstance     syscall.Handle
	hIcon         syscall.Handle
	hCursor       syscall.Handle
	hbrBackground syscall.Handle
	lpszMenuName  *uint16
	lpszClassName *uint16
	hIconSm       syscall.Handle
}

type msg struct {
	Hwnd    syscall.Handle
	Message uint32
	Wparam  uintptr
	Lparam  uintptr
	Time    uint32
	Pt      point
}

type paintStruct struct {
	Hdc         syscall.Handle
	FErase      int32
	RcPaint     rect
	FRestore    int32
	FIncUpdate  int32
	RgbReserved [32]byte
}

const (
	wsPopup        = 0x80000000
	wsVisible      = 0x10000000
	wsClipChildren = 0x02000000

	wmDestroy    = 0x0002
	wmPaint      = 0x000F
	wmTimer      = 0x0113
	wmNCHitTest  = 0x0084
	wmEraseBkgnd = 0x0014
	wmKeyDown    = 0x0100
	wmApp        = 0x8000

	msgPayloadDone = wmApp + 1

	htClient  = 1
	htCaption = 2

	vkEscape = 0x1B

	smCxScreen = 0
	smCyScreen = 1
	smCxIcon   = 11
	smCyIcon   = 12
	smCxSmIcon = 49
	smCySmIcon = 50

	imageIcon      = 1
	lrLoadFromFile = 0x00000010

	wmSetIcon = 0x0080
	iconSmall = 0
	iconBig   = 1

	idcArrow = 32512

	psSolid = 0

	transparent = 1

	dtCenter     = 0x0001
	dtRight      = 0x0002
	dtVcenter    = 0x0004
	dtSingleLine = 0x0020

	fwNormal = 400
	fwBold   = 700

	defaultCharset    = 1
	outTTPrecis       = 4
	clipDefaultPrecis = 0
	clearTypeQuality  = 5
	varPitch          = 2 << 4 // FF_SWISS(2)<<4 | VARIABLE_PITCH(2)
)

func mustUTF16Ptr(s string) *uint16 {
	p, err := syscall.UTF16PtrFromString(s)
	if err != nil {
		panic(err)
	}
	return p
}

func rgb(r, g, b byte) uintptr {
	return uintptr(r) | uintptr(g)<<8 | uintptr(b)<<16
}
