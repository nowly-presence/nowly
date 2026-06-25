# Nowly Host

Nowly Host bridges the Chromium extension with Discord Rich Presence.

## Contract

| Field | Value |
|-------|-------|
| Host name | `nowly.client` |
| Extension IDs | `kmnlnfldimgneaopdihplkebobckcjpf` (prod), `abbegmindbabanjcabnmcjmamaoffbam` (dev) |
| Binary | `nowly-host` (Unix) / `nowly-host.exe` (Windows) |
| Log dir | `~/.cache/NowlyClient/` (Unix) / `%LOCALAPPDATA%\NowlyClient\` (Windows) |

### Supported messages

| Type | Direction | Payload |
|------|-----------|---------|
| `PING` | Extension → Host | — |
| `PONG` | Host → Extension | `connected`, `status`, `discordConnected`, `profile` |
| `CONNECTED` | Host → Extension | — |
| `SET_ACTIVITY` | Extension → Host | `PresencePayload` |
| `CLEAR_ACTIVITY` | Extension → Host | — |
| `OK` | Host → Extension | — |
| `ERROR` | Host → Extension | `error` string |

## Build

### Prerequisites

- [Go 1.21+](https://go.dev/dl/)
- [Inno Setup 6+](https://jrsoftware.org/isdl.php) *(Windows installer only)*

### Build all platforms

```bash
make build
```

### Build Windows binary + installer (one command)

```bash
make installer HOST_VERSION=1.0.0-dev
```

Outputs `dist/nowly-host.exe` + `dist/NowlySetup.exe`.

### Platform-specific builds

#### Windows

```powershell
go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=1.0.0" -o dist/nowly-host.exe ./cmd/host
```

#### Linux

```bash
make build/linux
# or manually:
GOOS=linux GOARCH=amd64 go build -o dist/nowly-host-linux ./cmd/host
```

#### macOS (Intel)

```bash
make build/darwin
# or manually:
GOOS=darwin GOARCH=amd64 go build -o dist/nowly-host-darwin ./cmd/host
```

#### macOS (Apple Silicon)

```bash
make build/darwin-arm
# or manually:
GOOS=darwin GOARCH=arm64 go build -o dist/nowly-host-darwin-arm64 ./cmd/host
```

#### macOS (.app bundle + DMG)

```bash
make release/macos HOST_VERSION=1.0.0
# or from monorepo root:
pnpm build:macos
```

This produces a universal `Nowly Host.app` bundle (Intel + Apple Silicon in one binary via `lipo`) and a single `.dmg`.

| Output | Description |
|--------|-------------|
| `dist/Nowly Host.app` | Universal .app bundle |
| `dist/NowlyHost-macos.dmg` | Universal disk image |

The `.app` bundle is unsigned and unnotarized — no Apple Developer account required. On first launch, the binary automatically registers itself with Chrome/Firefox via native messaging manifests.

### Output

| Platform | Binary |
|----------|--------|
| Windows  | `dist/nowly-host.exe` |
| Linux    | `dist/nowly-host-linux` |
| macOS Intel | `dist/nowly-host-darwin` |
| macOS ARM | `dist/nowly-host-darwin-arm64` |

### CDN Artifacts

| Platform | Min. version | File | Size | Contents |
|----------|-------------|------|------|----------|
| Windows  | Windows 10 x64 | `NowlySetup.exe` | ~3.7 MB | Inno Setup installer (double-click to install) |
| Windows  | Windows 10 x64 | `nowly-windows.zip` | ~3.3 MB | Same `.exe` in a zip |
| Linux    | Linux 2.6.32+ / glibc 2.17+ | `nowly-linux.tar.gz` | ~1.9 MB | `nowly-host-linux` binary + install/uninstall scripts |
| macOS    | macOS 11 Big Sur+ | `nowly-macos.tar.gz` | ~3.7 MB | Intel + ARM binaries + install/uninstall scripts |
| macOS DMG | macOS 11 Big Sur+ (Universal) | `NowlyHost-macos.dmg` | ~6 MB | Universal .app bundle (Intel + Apple Silicon) |

## Release flow

### Quick release (build + publish to CDN)

```bash
make release-prod HOST_VERSION=1.0.0
```

This runs `scripts/release.sh` (or `release.ps1` on Windows) then `scripts/publish-prod.sh` (or `publish-prod.ps1`):

1. **Release**: builds all platform binaries, creates the Inno Setup installer (if `iscc` is available), packages archives, generates `latest.json` → `releases/{version}/`
2. **Publish**: uploads all artifacts to Cloudflare R2 via `pnpm internal-cli host:publish`

### Host releases via git tags

Push a tag named `native-vX.Y.Z`:

```bash
git tag native-v1.0.0
git push origin native-v1.0.0
```

The `Host Release` GitHub Action then builds and publishes automatically.

The extension checks `https://cdn.nowly.me/installer/latest.json` for updates. Once the workflow updates `latest.json`, users with an older Nowly Host version see the update prompt.

### Manual publish

```bash
pnpm internal-cli host:publish --release-version 1.0.0 --installer releases/1.0.0/nowly-setup.exe --portable releases/1.0.0/nowly-windows.zip --linux releases/1.0.0/nowly-linux.tar.gz --macos releases/1.0.0/nowly-macos.tar.gz
```

### Linux

```bash
# 1. Build
make build/linux

# 2. Install (copies binary + generates manifests for Chrome, Chromium, Brave, Edge, Vivaldi, Opera)
./scripts/install-linux.sh

# 3. Uninstall
./scripts/uninstall-linux.sh
```

### macOS

```bash
# 1. Build (Intel)
make build/darwin
# or (Apple Silicon)
make build/darwin-arm

# 2. Install (copies binary + generates manifests for Chrome, Chromium, Brave, Edge)
./scripts/install-macos.sh

# 3. Uninstall
./scripts/uninstall-macos.sh
```

The install scripts place the binary in `~/.local/share/NowlyClient/` (Linux) or `~/Library/Application Support/NowlyClient/` (macOS) and write the native messaging manifest to each browser's config directory.

The manifest allows both the prod and dev extension IDs, so a single install works with either version of the extension.

**Note:** The native messaging manifest points to the binary's absolute path. If you move the binary after installation, re-run the install script or update the manifest.

## Assets

| File | Source | Format |
|------|--------|--------|
| `installer.ico` | Generated from `assets/icon.png` | ICO 48×48 |
| `assets/banner.png` | Wizard banner (left panel) | PNG 202×386 |
| `assets/icon.png` | Wizard small logo | PNG 55×55 |

To regenerate `installer.ico` from the icon PNG:

```powershell
ffmpeg -y -i assets/icon.png -vf "scale=48:48" installer.ico
```
