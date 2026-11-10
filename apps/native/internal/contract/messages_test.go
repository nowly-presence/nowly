package contract

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestErrorWithCode(t *testing.T) {
	response := ErrorWithCode(ErrorDiscordIPCAccessDenied, "access denied")
	assertWireResponse(t, response, `{"type":"ERROR","code":"DISCORD_IPC_ACCESS_DENIED","error":"access denied"}`)
}

func TestPongUpdateFields(t *testing.T) {
	response := Pong(true, false, "connected", nil)
	response.Version = "1.4.8"
	response.Latest = "1.5.0"
	response.Update = true

	assertWireResponse(t, response, `{"type":"PONG","connected":true,"status":"connected","version":"1.4.8","latestVersion":"1.5.0","updateAvailable":true}`)
}

func assertWireResponse(t *testing.T, response NativeResponse, expectedJSON string) {
	t.Helper()
	payload, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	var got, want map[string]any
	if err := json.Unmarshal(payload, &got); err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal([]byte(expectedJSON), &want); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("unexpected JSON: %s, want %s", payload, expectedJSON)
	}
}
