package main

import (
	"encoding/json"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"runtime"
	"strings"

	"nowly.client/native/internal/contract"
	"nowly.client/native/internal/logging"
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

	supportDir := filepath.Join(home, macAppSupportDir)
	supportFS := os.DirFS(supportDir)

	installed := writeManifests(logger, chromiumManifestDirs(supportDir, supportFS), chromiumManifest(exe))
	geckoInstalled := writeManifests(logger, firefoxManifestDirs(supportDir, supportFS), firefoxManifest(exe))

	logger.Printf("install: registered for %d Chromium-based browsers + %d Firefox-based browsers", installed, geckoInstalled)
}

const (
	manifestDescription    = "Nowly Native Messaging Host"
	firefoxDevExtensionID  = "{01146c8d-3101-0d92-01dc-29c0c0e5510c}"
	firefoxProdExtensionID = "nowly@nowly.me"
	macAppSupportDir       = "Library/Application Support"
	manifestDirName        = "NativeMessagingHosts"
	mozillaVendorDir       = "Mozilla"
	chromiumStateFile      = "Local State"
	chromiumProfileDir     = "Default"
	geckoProfilesFile      = "profiles.ini"
	browserScanDepth       = 2
)

var knownChromiumDirs = []string{
	"Google/Chrome",
	"Chromium",
	"BraveSoftware/Brave-Browser",
	"Microsoft Edge",
}

var knownFirefoxForkDirs = []string{
	"LibreWolf",
	"Waterfox",
	"zen",
	"Floorp",
	"TorBrowser-Data/Browser/Mozilla",
}

type browserManifest struct {
	Name              string   `json:"name"`
	Description       string   `json:"description"`
	Path              string   `json:"path"`
	Type              string   `json:"type"`
	AllowedOrigins    []string `json:"allowed_origins,omitempty"`
	AllowedExtensions []string `json:"allowed_extensions,omitempty"`
}

func chromiumManifest(exe string) browserManifest {
	return browserManifest{
		Name:        contract.HostName,
		Description: manifestDescription,
		Path:        exe,
		Type:        "stdio",
		AllowedOrigins: []string{
			"chrome-extension://kmnlnfldimgneaopdihplkebobckcjpf/",
			"chrome-extension://abbegmindbabanjcabnmcjmamaoffbam/",
		},
	}
}

func firefoxManifest(exe string) browserManifest {
	return browserManifest{
		Name:              contract.HostName,
		Description:       manifestDescription,
		Path:              exe,
		Type:              "stdio",
		AllowedExtensions: []string{firefoxDevExtensionID, firefoxProdExtensionID},
	}
}

func writeManifests(logger *logging.Logger, dirs []string, manifest browserManifest) int {
	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		logger.Printf("install: encode manifest: %v", err)
		return 0
	}
	data = append(data, '\n')
	written := 0
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			logger.Printf("install: mkdir %s: %v", dir, err)
			continue
		}
		manifestPath := filepath.Join(dir, manifest.Name+".json")
		if err := os.WriteFile(manifestPath, data, 0644); err != nil {
			logger.Printf("install: write %s: %v", manifestPath, err)
			continue
		}
		logger.Printf("install: wrote %s", manifestPath)
		written++
	}
	return written
}

func chromiumManifestDirs(supportDir string, fsys fs.FS) []string {
	browserDirs := append([]string{}, knownChromiumDirs...)
	browserDirs = append(browserDirs, findBrowserDirs(fsys, isChromiumUserDataDir)...)
	return manifestDirsFor(supportDir, browserDirs)
}

func firefoxManifestDirs(supportDir string, fsys fs.FS) []string {
	browserDirs := []string{mozillaVendorDir}
	for _, fork := range knownFirefoxForkDirs {
		if isDir(fsys, fork) {
			browserDirs = append(browserDirs, fork)
		}
	}
	browserDirs = append(browserDirs, findBrowserDirs(fsys, isGeckoProfileRoot)...)
	return manifestDirsFor(supportDir, browserDirs)
}

func manifestDirsFor(supportDir string, browserDirs []string) []string {
	seen := map[string]bool{}
	dirs := []string{}
	for _, browserDir := range browserDirs {
		key := strings.ToLower(browserDir)
		if seen[key] {
			continue
		}
		seen[key] = true
		dirs = append(dirs, filepath.Join(supportDir, filepath.FromSlash(browserDir), manifestDirName))
	}
	return dirs
}

func findBrowserDirs(fsys fs.FS, matches func(fs.FS, string) bool) []string {
	found := []string{}
	var scan func(dir string, depth int)
	scan = func(dir string, depth int) {
		entries, err := fs.ReadDir(fsys, dir)
		if err != nil {
			return
		}
		for _, entry := range entries {
			if !entry.IsDir() || entry.Name() == manifestDirName {
				continue
			}
			child := path.Join(dir, entry.Name())
			if matches(fsys, child) {
				found = append(found, child)
				continue
			}
			if depth < browserScanDepth {
				scan(child, depth+1)
			}
		}
	}
	scan(".", 1)
	return found
}

func isChromiumUserDataDir(fsys fs.FS, dir string) bool {
	return isFile(fsys, path.Join(dir, chromiumStateFile)) && isDir(fsys, path.Join(dir, chromiumProfileDir))
}

func isGeckoProfileRoot(fsys fs.FS, dir string) bool {
	return isFile(fsys, path.Join(dir, geckoProfilesFile))
}

func isFile(fsys fs.FS, name string) bool {
	info, err := fs.Stat(fsys, name)
	return err == nil && info.Mode().IsRegular()
}

func isDir(fsys fs.FS, name string) bool {
	info, err := fs.Stat(fsys, name)
	return err == nil && info.IsDir()
}
