//go:build darwin

package notifications

import "os/exec"

// DiscordAccessDenied displays a macOS notification without elevating the
// native host or changing the extension/native messaging contract.
func DiscordAccessDenied() error {
	return exec.Command(
		"osascript",
		"-e",
		`tell application "System Events" to display notification "Nowly cannot access Discord's local connection. Close Discord and relaunch it, then reconnect Nowly." with title "Nowly - Discord connection"`,
	).Run()
}
