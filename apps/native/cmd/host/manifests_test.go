package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"testing"
	"testing/fstest"
)

func sameEntries(got, want []string) bool {
	slices.Sort(got)
	slices.Sort(want)
	return slices.Equal(got, want)
}

func TestBrowserManifests(t *testing.T) {
	exe := `/Applications/Nowly "Dev" \ Host.app/Contents/MacOS/nowly-host`
	tests := []struct {
		name       string
		manifest   browserManifest
		origins    []string
		extensions []string
	}{
		{
			name:     "Chromium",
			manifest: chromiumManifest(exe),
			origins: []string{
				"chrome-extension://kmnlnfldimgneaopdihplkebobckcjpf/",
				"chrome-extension://abbegmindbabanjcabnmcjmamaoffbam/",
			},
		},
		{
			name:       "Firefox",
			manifest:   firefoxManifest(exe),
			extensions: []string{"{01146c8d-3101-0d92-01dc-29c0c0e5510c}", "nowly@nowly.me"},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dir := t.TempDir()
			if written := writeManifests(nil, []string{dir}, tt.manifest); written != 1 {
				t.Fatalf("expected one manifest, wrote %d", written)
			}
			data, err := os.ReadFile(filepath.Join(dir, "nowly.client.json"))
			if err != nil {
				t.Fatal(err)
			}
			var manifest browserManifest
			if err := json.Unmarshal(data, &manifest); err != nil {
				t.Fatal(err)
			}
			if manifest.Name != "nowly.client" || manifest.Type != "stdio" || manifest.Path != exe {
				t.Fatalf("unexpected manifest header: %+v", manifest)
			}
			if !sameEntries(manifest.AllowedOrigins, tt.origins) || !sameEntries(manifest.AllowedExtensions, tt.extensions) {
				t.Fatalf("unexpected allowed browsers: %+v", manifest)
			}
		})
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
	if !sameEntries(got, want) {
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
	if !sameEntries(got, want) {
		t.Fatalf("firefoxManifestDirs() =\n%v\nwant\n%v", got, want)
	}
}

func TestFirefoxManifestDirsKeepsMozillaWithoutBrowsers(t *testing.T) {
	support := "/Users/test/Library/Application Support"
	got := firefoxManifestDirs(support, fstest.MapFS{})
	want := []string{filepath.Join(support, "Mozilla/NativeMessagingHosts")}
	if !sameEntries(got, want) {
		t.Fatalf("firefoxManifestDirs() = %v, want %v", got, want)
	}
}

func TestInstallerScriptsAllowEveryBrowserID(t *testing.T) {
	ids := []string{
		"kmnlnfldimgneaopdihplkebobckcjpf",
		"abbegmindbabanjcabnmcjmamaoffbam",
		"{01146c8d-3101-0d92-01dc-29c0c0e5510c}",
		"nowly@nowly.me",
	}
	for _, path := range []string{
		"../../installer.iss",
		"../../scripts/build-deb.sh",
		"../../scripts/install-linux.sh",
		"../../scripts/install-macos.sh",
	} {
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		for _, id := range ids {
			if !strings.Contains(string(data), id) {
				t.Errorf("%s does not allow %s", path, id)
			}
		}
	}
}
