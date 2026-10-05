package main

import (
	"errors"
	"testing"

	"nowly.client/native/internal/contract"
)

func TestShouldNotifyDiscordAccessDenied(t *testing.T) {
	if !shouldNotifyDiscordAccessDenied(errors.New(`open \\.\pipe\discord-ipc-0: Access is denied.`), false) {
		t.Fatal("expected access-denied errors to trigger a notification")
	}
	if shouldNotifyDiscordAccessDenied(errors.New(`open \\.\pipe\discord-ipc-0: Access is denied.`), true) {
		t.Fatal("expected an already-notified error to be suppressed")
	}
	if shouldNotifyDiscordAccessDenied(errors.New("The system cannot find the file specified."), false) {
		t.Fatal("expected unrelated IPC errors to be ignored")
	}
}

func TestDiscordErrorCode(t *testing.T) {
	err := errors.New(`open \\.\pipe\discord-ipc-0: Access is denied.`)
	if got := discordErrorCode(err); got != contract.ErrorDiscordIPCAccessDenied {
		t.Fatalf("discordErrorCode(%v) = %q, want %q", err, got, contract.ErrorDiscordIPCAccessDenied)
	}

	response := discordErrorResponse(err)
	if response.Code != contract.ErrorDiscordIPCAccessDenied || response.Error != err.Error() {
		t.Fatalf("unexpected coded response: %+v", response)
	}
}
