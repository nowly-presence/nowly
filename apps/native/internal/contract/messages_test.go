package contract

import (
	"encoding/json"
	"testing"
)

func TestErrorWithCode(t *testing.T) {
	response := ErrorWithCode(ErrorDiscordIPCAccessDenied, "access denied")
	if response.Type != ResponseError || response.Code != ErrorDiscordIPCAccessDenied || response.Error != "access denied" {
		t.Fatalf("unexpected response: %+v", response)
	}

	payload, err := json.Marshal(response)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}
	if string(payload) != `{"type":"ERROR","code":"DISCORD_IPC_ACCESS_DENIED","error":"access denied"}` {
		t.Fatalf("unexpected JSON: %s", payload)
	}
}

func TestPongUpdateFields(t *testing.T) {
	response := Pong(true, "connected")
	response.Version = "1.4.8"
	response.Latest = "1.5.0"
	response.Update = true

	payload, err := json.Marshal(response)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}
	if string(payload) != `{"type":"PONG","connected":true,"status":"connected","version":"1.4.8","latestVersion":"1.5.0","updateAvailable":true}` {
		t.Fatalf("unexpected JSON: %s", payload)
	}
}
