//go:build linux

package notifications

import "os/exec"

// DiscordAccessDenied displays a Linux desktop notification through the
// user's notification daemon without changing the extension/native contract.
func DiscordAccessDenied() error {
	return exec.Command(
		"notify-send",
		"--urgency=critical",
		"--app-name=Nowly",
		"Nowly cannot access Discord's local connection. Close Discord and relaunch it, then reconnect Nowly.",
	).Run()
}
