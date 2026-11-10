package main

import (
	"errors"
	"testing"

	"nowly.client/native/internal/contract"
	"nowly.client/native/internal/logging"
)

var errAccessDenied = errors.New(`open \.\pipe\discord-ipc-0: Access is denied.`)

func TestAccessDeniedNotifierWarnsOncePerStreak(t *testing.T) {
	shown := 0
	n := &accessDeniedNotifier{notify: func() error { shown++; return nil }, logger: (*logging.Logger)(nil)}

	n.observe(errors.New("The system cannot find the file specified."))
	n.observe(errAccessDenied)
	n.observe(errAccessDenied)
	if shown != 1 {
		t.Fatalf("warnings shown = %d, want 1", shown)
	}

	n.reset()
	n.observe(errAccessDenied)
	if shown != 2 {
		t.Fatalf("warnings after reset = %d, want 2", shown)
	}
}

func TestDiscordErrorResponseCarriesCodeOnlyForAccessDenied(t *testing.T) {
	denied := discordErrorResponse(errAccessDenied)
	if denied.Code != contract.ErrorDiscordIPCAccessDenied || denied.Error != errAccessDenied.Error() {
		t.Fatalf("unexpected coded response: %+v", denied)
	}
	if other := discordErrorResponse(errors.New("boom")); other.Code != "" {
		t.Fatalf("unexpected code on generic error: %+v", other)
	}
}
