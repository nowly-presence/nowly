package discord

import (
	"strings"
	"unicode/utf8"

	"nowly.client/native/internal/contract"
)

type Activity struct {
	Name       string      `json:"name,omitempty"`
	Type       int         `json:"type"`
	Details    string      `json:"details,omitempty"`
	State      string      `json:"state,omitempty"`
	Timestamps *Timestamps `json:"timestamps,omitempty"`
	Assets     *Assets     `json:"assets,omitempty"`
	Buttons    []Button    `json:"buttons,omitempty"`
}

type Timestamps struct {
	Start int64 `json:"start,omitempty"`
	End   int64 `json:"end,omitempty"`
}

type Assets struct {
	LargeImage string `json:"large_image,omitempty"`
	LargeText  string `json:"large_text,omitempty"`
	SmallImage string `json:"small_image,omitempty"`
	SmallText  string `json:"small_text,omitempty"`
}

type Button struct {
	Label string `json:"label"`
	URL   string `json:"url"`
}

func sanitizeAssetText(value string) string {
	value = strings.TrimSpace(value)
	if utf8.RuneCountInString(value) < 2 {
		return ""
	}
	return value
}

func ActivityFromPresence(p contract.PresencePayload) Activity {
	largeText := sanitizeAssetText(p.LargeText)
	smallText := sanitizeAssetText(p.SmallText)
	activity := Activity{
		Name:    p.Name,
		Type:    p.Type,
		Details: p.Details,
		State:   p.State,
	}

	if p.StartTime > 0 || p.EndTime > 0 {
		ts := &Timestamps{}
		if p.StartTime > 0 {
			ts.Start = p.StartTime
		}
		if p.EndTime > 0 {
			ts.End = p.EndTime
		}
		activity.Timestamps = ts
	}

	if p.LargeImage != "" || largeText != "" || p.SmallImage != "" || smallText != "" {
		assets := &Assets{}
		if p.LargeImage != "" {
			assets.LargeImage = p.LargeImage
		}
		if largeText != "" {
			assets.LargeText = largeText
		}
		if p.SmallImage != "" {
			assets.SmallImage = p.SmallImage
		}
		if smallText != "" {
			assets.SmallText = smallText
		}
		activity.Assets = assets
	}

	if len(p.Buttons) > 0 {
		buttons := make([]Button, 0, len(p.Buttons))
		for _, b := range p.Buttons {
			if b.Label != "" && b.URL != "" {
				buttons = append(buttons, Button{Label: b.Label, URL: b.URL})
			}
		}
		activity.Buttons = buttons
	}

	return activity
}
