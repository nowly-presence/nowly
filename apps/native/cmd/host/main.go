package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"

	"nowly.client/native/internal/contract"
	"nowly.client/native/internal/discord"
	"nowly.client/native/internal/logging"
	nativeprotocol "nowly.client/native/internal/native"
	"nowly.client/native/internal/notifications"
	"nowly.client/native/internal/update"
)

// accessDeniedNotifier shows the Discord permission warning once per denied streak.
type accessDeniedNotifier struct {
	notify   func() error
	logger   *logging.Logger
	notified bool
}

func (n *accessDeniedNotifier) observe(err error) {
	if n.notified || !discord.IsAccessDenied(err) {
		return
	}
	n.notified = true
	if notifyErr := n.notify(); notifyErr != nil {
		n.logger.Printf("notification: failed to show Discord permission warning: %v", notifyErr)
	}
}

func (n *accessDeniedNotifier) reset() { n.notified = false }

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

func main() {
	logger, logErr := logging.New(contract.InstallFolderName)
	if logErr != nil {
		fmt.Fprintf(os.Stderr, "nowly host: logging disabled: %v\n", logErr)
	}
	defer logger.Close()
	logger.Printf("nowly host starting pid=%d version=%s", os.Getpid(), contract.HostVersion)

	installManifests(logger)

	protocol := nativeprotocol.NewProtocol(os.Stdin, os.Stdout)
	client := discord.NewClient(contract.DiscordClientID, logger.Printf)
	defer client.Close()

	updates := update.NewChecker(contract.HostVersion, logger)
	updateCtx, stopUpdates := context.WithCancel(context.Background())
	defer stopUpdates()
	go updates.Run(updateCtx)

	_ = protocol.Write(contract.Connected())

	lastActivityLogKey := ""
	lastLoggedClear := false
	denied := &accessDeniedNotifier{notify: notifications.DiscordAccessDenied, logger: logger}

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
				denied.observe(connectErr)
			} else {
				denied.reset()
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

			pong := contract.Pong(true, discordConnected, status, profile)
			pong.Code = discordErrorCode(connectErr)
			if latest, newer := updates.Latest(); newer {
				pong.Latest = latest
				pong.Update = true
			}
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
				denied.observe(err)
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
				denied.observe(err)
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
