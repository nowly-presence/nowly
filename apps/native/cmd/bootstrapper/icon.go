//go:build windows

package main

import (
	_ "embed"
	"os"
	"unsafe"
)

//go:embed icon.ico
var appIconBytes []byte

// setWindowIcon gives the running window (and its taskbar entry) the real
// Nowly brand icon. LoadImageW only reads icons from a file, so the embedded
// bytes are written to a temp file first, same pattern as the payload.
// Best-effort: on any failure the window just keeps the default icon.
func setWindowIcon(hwnd uintptr) {
	if len(appIconBytes) == 0 {
		return
	}

	tmp, err := os.CreateTemp("", "nowly-icon-*.ico")
	if err != nil {
		return
	}
	path := tmp.Name()
	defer os.Remove(path)

	if _, err := tmp.Write(appIconBytes); err != nil {
		tmp.Close()
		return
	}
	tmp.Close()

	pathPtr := mustUTF16Ptr(path)

	cxBig, _, _ := procGetSystemMetrics.Call(uintptr(smCxIcon))
	cyBig, _, _ := procGetSystemMetrics.Call(uintptr(smCyIcon))
	hIconBig, _, _ := procLoadImageW.Call(0, uintptr(unsafe.Pointer(pathPtr)), uintptr(imageIcon), cxBig, cyBig, uintptr(lrLoadFromFile))
	if hIconBig != 0 {
		procSendMessageW.Call(hwnd, uintptr(wmSetIcon), uintptr(iconBig), hIconBig)
	}

	cxSmall, _, _ := procGetSystemMetrics.Call(uintptr(smCxSmIcon))
	cySmall, _, _ := procGetSystemMetrics.Call(uintptr(smCySmIcon))
	hIconSmall, _, _ := procLoadImageW.Call(0, uintptr(unsafe.Pointer(pathPtr)), uintptr(imageIcon), cxSmall, cySmall, uintptr(lrLoadFromFile))
	if hIconSmall != 0 {
		procSendMessageW.Call(hwnd, uintptr(wmSetIcon), uintptr(iconSmall), hIconSmall)
	}
}
