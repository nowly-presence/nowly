package main

import (
	"encoding/json"
	"errors"
	"path/filepath"
	"reflect"
	"testing"
	"testing/fstest"

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

func TestFirefoxManifestAllowsStoreAndDevExtensions(t *testing.T) {
	var manifest struct {
		Name              string   `json:"name"`
		Path              string   `json:"path"`
		Type              string   `json:"type"`
		AllowedExtensions []string `json:"allowed_extensions"`
	}
	if err := json.Unmarshal([]byte(firefoxManifest(contract.HostName, "/Applications/Nowly Host.app/Contents/MacOS/nowly-host")), &manifest); err != nil {
		t.Fatalf("firefox manifest is not valid JSON: %v", err)
	}
	if manifest.Name != contract.HostName || manifest.Type != "stdio" {
		t.Fatalf("unexpected manifest header: %+v", manifest)
	}
	if manifest.Path != "/Applications/Nowly Host.app/Contents/MacOS/nowly-host" {
		t.Fatalf("unexpected manifest path: %q", manifest.Path)
	}
	want := map[string]bool{"nowly@nowly.me": false, "{01146c8d-3101-0d92-01dc-29c0c0e5510c}": false}
	for _, id := range manifest.AllowedExtensions {
		if _, ok := want[id]; !ok {
			t.Fatalf("unexpected allowed extension %q", id)
		}
		want[id] = true
	}
	for id, found := range want {
		if !found {
			t.Fatalf("allowed_extensions is missing %q", id)
		}
	}
}

func browserFS() fstest.MapFS {
	return fstest.MapFS{
		"Google/Chrome/Local State":           {Data: []byte("{}")},
		"Google/Chrome/Default/Preferences":   {Data: []byte("{}")},
		"Vivaldi/Local State":                 {Data: []byte("{}")},
		"Vivaldi/Default/Preferences":         {Data: []byte("{}")},
		"Arc/User Data/Local State":           {Data: []byte("{}")},
		"Arc/User Data/Default/Preferences":   {Data: []byte("{}")},
		"discord/Local State":                 {Data: []byte("{}")},
		"discord/Preferences":                 {Data: []byte("{}")},
		"Firefox/profiles.ini":                {Data: []byte("[General]")},
		"librewolf/profiles.ini":              {Data: []byte("[General]")},
		"Floorp/profiles.ini":                 {Data: []byte("[General]")},
		"Mozilla/NativeMessagingHosts/x.json": {Data: []byte("{}")},
		"Notes/data.db":                       {Data: []byte("")},
	}
}

func TestChromiumManifestDirsDetectsInstalledBrowsers(t *testing.T) {
	support := "/Users/test/Library/Application Support"
	got := chromiumManifestDirs(support, browserFS())
	want := []string{
		filepath.Join(support, "Google/Chrome/NativeMessagingHosts"),
		filepath.Join(support, "Chromium/NativeMessagingHosts"),
		filepath.Join(support, "BraveSoftware/Brave-Browser/NativeMessagingHosts"),
		filepath.Join(support, "Microsoft Edge/NativeMessagingHosts"),
		filepath.Join(support, "Arc/User Data/NativeMessagingHosts"),
		filepath.Join(support, "Vivaldi/NativeMessagingHosts"),
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("chromiumManifestDirs() =\n%v\nwant\n%v", got, want)
	}
}

func TestFirefoxManifestDirsDetectsForks(t *testing.T) {
	support := "/Users/test/Library/Application Support"
	got := firefoxManifestDirs(support, browserFS())
	want := []string{
		filepath.Join(support, "Mozilla/NativeMessagingHosts"),
		filepath.Join(support, "Floorp/NativeMessagingHosts"),
		filepath.Join(support, "Firefox/NativeMessagingHosts"),
		filepath.Join(support, "librewolf/NativeMessagingHosts"),
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("firefoxManifestDirs() =\n%v\nwant\n%v", got, want)
	}
}

func TestFirefoxManifestDirsKeepsMozillaWithoutBrowsers(t *testing.T) {
	support := "/Users/test/Library/Application Support"
	got := firefoxManifestDirs(support, fstest.MapFS{})
	want := []string{filepath.Join(support, "Mozilla/NativeMessagingHosts")}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("firefoxManifestDirs() = %v, want %v", got, want)
	}
}
