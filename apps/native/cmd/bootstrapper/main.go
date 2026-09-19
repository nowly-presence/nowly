//go:build windows

// Command bootstrapper is the user-facing NowlySetup.exe: a small branded
// window (rounded, borderless, animated spinner) that silently runs the
// real Inno Setup payload embedded via go:embed and reports the result.
package main

import (
	_ "embed"
	"os"
	"os/exec"
	"runtime"
	"sync"
	"syscall"
)

func init() {
	// The window, its timers, and the message loop must all live on the
	// same OS thread — Win32 handles are thread-affine. Without this, Go's
	// scheduler can migrate the goroutine mid-run and GetMessageW ends up
	// listening on a different thread than the one that owns the window,
	// which shows up as a frozen spinner, a window that never paints, or
	// a message loop that hangs forever.
	runtime.LockOSThread()
}

//go:embed payload.exe
var payloadBytes []byte

// version is set at build time via -ldflags "-X main.version=1.2.3".
var version = "dev"

const swShow = 5

var (
	runningCmd   *exec.Cmd
	runningCmdMu sync.Mutex
)

func main() {
	procSetProcessDPIAware.Call()

	hwnd, err := createWindow()
	if err != nil {
		os.Exit(1)
	}

	app = &appState{
		hwnd:    hwnd,
		lang:    detectLocale(),
		version: version,
	}
	initGDIObjects()
	setWindowIcon(uintptr(hwnd))
	app.onEscape = func() {
		runningCmdMu.Lock()
		cmd := runningCmd
		runningCmdMu.Unlock()
		if cmd != nil && cmd.Process != nil {
			_ = cmd.Process.Kill()
		}
		procDestroyWindow.Call(uintptr(hwnd))
	}

	procShowWindow.Call(uintptr(hwnd), swShow)
	procUpdateWindow.Call(uintptr(hwnd))
	procSetTimer.Call(uintptr(hwnd), uintptr(timerSpin), uintptr(spinnerMs), 0)

	go runPayload(hwnd)

	runMessageLoop()
}

func runPayload(hwnd syscall.Handle) {
	code := runPayloadExitCode()
	procPostMessageW.Call(uintptr(hwnd), uintptr(msgPayloadDone), uintptr(code), 0)
}

func runPayloadExitCode() int {
	tmp, err := os.CreateTemp("", "nowly-payload-*.exe")
	if err != nil {
		return 1
	}
	path := tmp.Name()
	defer os.Remove(path)

	if _, err := tmp.Write(payloadBytes); err != nil {
		tmp.Close()
		return 1
	}
	tmp.Close()

	cmd := exec.Command(path, "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/SP-")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}

	runningCmdMu.Lock()
	runningCmd = cmd
	runningCmdMu.Unlock()

	if err := cmd.Run(); err != nil {
		return 1
	}
	return 0
}
