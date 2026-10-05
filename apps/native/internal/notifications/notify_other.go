//go:build !windows && !darwin && !linux

package notifications

// DiscordAccessDenied is unavailable on unsupported desktop platforms.
func DiscordAccessDenied() error {
	return nil
}
