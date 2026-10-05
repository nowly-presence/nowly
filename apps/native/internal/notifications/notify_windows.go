//go:build windows

package notifications

import (
	"io"
	"os/exec"
)

const discordAccessDeniedScript = `$ErrorActionPreference = 'SilentlyContinue'; Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; $notification = New-Object System.Windows.Forms.NotifyIcon; $notification.Icon = [System.Drawing.SystemIcons]::Warning; $notification.Visible = $true; $notification.BalloonTipTitle = 'Nowly - Discord connection'; $notification.BalloonTipText = 'Discord is running as administrator. Close Discord and relaunch it normally, then reconnect Nowly.'; $notification.ShowBalloonTip(10000); Start-Sleep -Seconds 10; $notification.Dispose()`

// DiscordAccessDenied displays a native Windows notification without elevating
// the native host or changing the extension/native messaging contract.
func DiscordAccessDenied() error {
	command := exec.Command(
		"powershell.exe",
		"-Sta",
		"-NoProfile",
		"-NonInteractive",
		"-WindowStyle",
		"Hidden",
		"-Command",
		discordAccessDeniedScript,
	)
	command.Stdout = io.Discard
	command.Stderr = io.Discard
	return command.Start()
}
