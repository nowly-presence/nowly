package main

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"nowly.client/native/internal/contract"
	"nowly.client/native/internal/discord"
	"nowly.client/native/internal/logging"
	"nowly.client/native/internal/notifications"
	nativeprotocol "nowly.client/native/internal/native"
)

func installManifests(logger *logging.Logger) {
	if runtime.GOOS != "darwin" {
		return
	}

	exe, err := os.Executable()
	if err != nil {
		logger.Printf("install: failed to get executable path: %v", err)
		return
	}

	if !strings.Contains(exe, ".app/Contents/MacOS/") {
		return
	}

	logger.Printf("install: detected .app bundle at %s", exe)

	home, err := os.UserHomeDir()
	if err != nil {
		logger.Printf("install: failed to get home dir: %v", err)
		return
	}

	hostName := contract.HostName

	chromeManifest := fmt.Sprintf(`{
  "name": "%s",
  "description": "Nowly Native Messaging Host",
  "path": "%s",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://kmnlnfldimgneaopdihplkebobckcjpf/",
    "chrome-extension://abbegmindbabanjcabnmcjmamaoffbam/"
  ]
}
`, hostName, exe)

	firefoxManifest := fmt.Sprintf(`{
  "name": "%s",
  "description": "Nowly Native Messaging Host",
  "path": "%s",
  "type": "stdio",
  "allowed_extensions": [
    "abbegmindbabanjcabnmcjmamaoffbam"
  ]
}
`, hostName, exe)

	browserDirs := []string{
		"Google/Chrome",
		"Chromium",
		"BraveSoftware/Brave-Browser",
		"Microsoft Edge",
	}

	installed := 0
	for _, browser := range browserDirs {
		dir := filepath.Join(home, "Library/Application Support", browser, "NativeMessagingHosts")
		if err := os.MkdirAll(dir, 0755); err != nil {
			logger.Printf("install: mkdir %s: %v", dir, err)
			continue
		}
		path := filepath.Join(dir, hostName+".json")
		if err := os.WriteFile(path, []byte(chromeManifest), 0644); err != nil {
			logger.Printf("install: write %s: %v", path, err)
			continue
		}
		logger.Printf("install: wrote %s", path)
		installed++
	}

	firefoxDir := filepath.Join(home, "Library/Application Support/Mozilla/NativeMessagingHosts")
	if err := os.MkdirAll(firefoxDir, 0755); err != nil {
		logger.Printf("install: mkdir %s: %v", firefoxDir, err)
	} else {
		path := filepath.Join(firefoxDir, hostName+".json")
		if err := os.WriteFile(path, []byte(firefoxManifest), 0644); err != nil {
			logger.Printf("install: write %s: %v", path, err)
		} else {
			logger.Printf("install: wrote %s", path)
		}
	}

	logger.Printf("install: registered for %d Chromium-based browsers + Firefox", installed)
}

func shouldNotifyDiscordAccessDenied(err error, notified bool) bool {
	return !notified && discord.IsAccessDenied(err)
}

func discordErrorCode(err error) contract.ErrorCode {
	if discord.IsAccessDenied(err) {
		return contract.ErrorDiscordIPCAccessDenied
	}
	return ""
}

func discordErrorResponse(err error) contract.NativeResponse {
	if code := discordErrorCode(err); code != "" {
		return contract.ErrorWithCode(code, err.Error())
	}
	return contract.Error(err.Error())
}

func maybeNotifyDiscordAccessDenied(logger *logging.Logger, err error, notified *bool) {
	if !shouldNotifyDiscordAccessDenied(err, *notified) {
		return
	}
	*notified = true
	if notifyErr := notifications.DiscordAccessDenied(); notifyErr != nil {
		logger.Printf("notification: failed to show Discord permission warning: %v", notifyErr)
	}
}

func main() {
	logger, _ := logging.New()
	defer logger.Close()
	logger.Printf("nowly host starting pid=%d version=%s", os.Getpid(), contract.HostVersion)

	installManifests(logger)

	protocol := nativeprotocol.NewProtocol(os.Stdin, os.Stdout)
	client := discord.NewClient(contract.DiscordClientID)
	client.SetLogger(logger)
	defer client.Close()

	_ = protocol.Write(contract.Connected())

	lastActivityLogKey := ""
	lastLoggedClear := false
	accessDeniedNotified := false

	for {
		var message contract.NativeMessage
		if err := protocol.Read(&message); err != nil {
			if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
				return
			}
			_ = protocol.Write(contract.Error(err.Error()))
			continue
		}

		switch message.Type {
		case contract.MessagePing:
			// Best-effort attempt to connect to Discord so the extension can detect
			// a successful setup without requiring an activity update first.
			connectErr := client.Connect()
			if connectErr != nil {
				maybeNotifyDiscordAccessDenied(logger, connectErr, &accessDeniedNotified)
			} else {
				accessDeniedNotified = false
			}
			status := "connected"
			discordConnected := client.Connected()
			if discordConnected {
				status = "discord connected"
			}

			var profile *contract.DiscordProfile
			if p := client.Profile(); discordConnected && p != nil {
				profile = &contract.DiscordProfile{ID: p.ID, Username: p.Username, GlobalName: p.GlobalName, Avatar: p.Avatar}
			}

			pong := contract.PongWithProfile(true, discordConnected, status, profile)
			pong.Code = discordErrorCode(connectErr)
			_ = protocol.Write(pong)

		case contract.MessageSetActivity:
			if message.Presence == nil {
				logger.Printf("native -> ERROR presence missing")
				_ = protocol.Write(contract.Error("presence missing"))
				continue
			}
			logKey := activityLogKey(*message.Presence)
			if logKey != lastActivityLogKey {
				logger.Printf("native <- SET_ACTIVITY %s", logKey)
				lastActivityLogKey = logKey
			}
			lastLoggedClear = false

			activity := discord.ActivityFromPresence(*message.Presence)
			if err := client.SetActivity(activity); err != nil {
				logger.Printf("native -> ERROR %v", err)
				maybeNotifyDiscordAccessDenied(logger, err, &accessDeniedNotified)
				_ = protocol.Write(discordErrorResponse(err))
				continue
			}
			_ = protocol.Write(contract.OK())

		case contract.MessageClearActivity:
			if !lastLoggedClear {
				logger.Printf("native <- CLEAR_ACTIVITY")
			}
			lastActivityLogKey = ""
			lastLoggedClear = true

			if err := client.ClearActivity(); err != nil {
				logger.Printf("native -> ERROR %v", err)
				maybeNotifyDiscordAccessDenied(logger, err, &accessDeniedNotified)
				_ = protocol.Write(discordErrorResponse(err))
				continue
			}
			_ = protocol.Write(contract.OK())

		default:
			logger.Printf("native -> ERROR unknown message type %q", message.Type)
			_ = protocol.Write(contract.Error("unknown message type"))
		}
	}
}

func activityLogKey(p contract.PresencePayload) string {
	return fmt.Sprintf(
		"name=%q type=%d details=%q state=%q largeImage=%q buttons=%d",
		p.Name,
		p.Type,
		p.Details,
		p.State,
		p.LargeImage,
		len(p.Buttons),
	)
}
