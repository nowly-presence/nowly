package discord

import (
	"encoding/json"
	"fmt"
	"testing"

	"nowly.client/native/internal/contract"
)

func TestStatusDisplayTypeContract(t *testing.T) {
	for _, value := range []int{0, 1, 2, -1, 3} {
		t.Run(fmt.Sprint(value), func(t *testing.T) {
			var payload contract.PresencePayload
			if err := json.Unmarshal([]byte(fmt.Sprintf(`{"name":"YouTube","details":"Video","statusDisplayType":%d}`, value)), &payload); err != nil {
				t.Fatal(err)
			}
			encoded, err := json.Marshal(ActivityFromPresence(payload))
			if err != nil {
				t.Fatal(err)
			}
			var activity map[string]any
			if err := json.Unmarshal(encoded, &activity); err != nil {
				t.Fatal(err)
			}
			got, present := activity["status_display_type"]
			if value >= 0 && value <= 2 {
				if !present || got != float64(value) {
					t.Fatalf("status_display_type = %v (present %v), want %d", got, present, value)
				}
			} else if present {
				t.Fatalf("invalid status_display_type was forwarded: %v", got)
			}
		})
	}
}

func TestStatusDisplayTypeOmittedForLegacyPresence(t *testing.T) {
	encoded, err := json.Marshal(ActivityFromPresence(contract.PresencePayload{Name: "YouTube"}))
	if err != nil {
		t.Fatal(err)
	}
	var activity map[string]any
	if err := json.Unmarshal(encoded, &activity); err != nil {
		t.Fatal(err)
	}
	if _, present := activity["status_display_type"]; present {
		t.Fatal("legacy presence gained a status_display_type")
	}
}
