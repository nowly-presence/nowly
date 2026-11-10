#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "  e.g. $0 1.0.0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
RELEASE_DIR="$ROOT_DIR/releases/$VERSION"

echo "=== Nowly Host v$VERSION release ==="
echo ""

echo ">> Building binaries..."
mkdir -p "$DIST_DIR"

GOOS=windows GOARCH=amd64 go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$VERSION" -o "$DIST_DIR/nowly-host.exe" ./cmd/host
echo "   ✔ nowly-host.exe"

GOOS=linux GOARCH=amd64 go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$VERSION" -o "$DIST_DIR/nowly-host-linux" ./cmd/host
echo "   ✔ nowly-host-linux"

GOOS=darwin GOARCH=amd64 go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$VERSION" -o "$DIST_DIR/nowly-host-darwin" ./cmd/host
echo "   ✔ nowly-host-darwin (Intel)"

GOOS=darwin GOARCH=arm64 go build -ldflags "-X nowly.client/native/internal/contract.HostVersion=$VERSION" -o "$DIST_DIR/nowly-host-darwin-arm64" ./cmd/host
echo "   ✔ nowly-host-darwin-arm64 (Apple Silicon)"
echo ""

mkdir -p "$RELEASE_DIR"

ISCC=""
if command -v iscc &>/dev/null; then
  ISCC="iscc"
elif [ -f "/c/Program Files (x86)/Inno Setup 6/ISCC.exe" ]; then
  ISCC="/c/Program Files (x86)/Inno Setup 6/ISCC.exe"
elif [ -f "/c/Program Files/Inno Setup 6/ISCC.exe" ]; then
  ISCC="/c/Program Files/Inno Setup 6/ISCC.exe"
fi

if [ -n "$ISCC" ]; then
  echo ">> Building Windows installer..."
  "$ISCC" "$ROOT_DIR/installer.iss" \
    /DAPP_VERSION="$VERSION"
  
  if [ -f "$DIST_DIR/NowlySetup.exe" ]; then
    cp "$DIST_DIR/NowlySetup.exe" "$RELEASE_DIR/nowly-setup.exe"
    echo "   ✔ nowly-setup.exe"
  fi
else
  echo "   ⚠ iscc not found — skipping Windows installer"
fi
echo ""

if [ -f "$DIST_DIR/nowly-host.exe" ]; then
  echo ">> Creating Windows portable..."
  cd "$DIST_DIR"
  zip -q "$RELEASE_DIR/nowly-windows.zip" nowly-host.exe
  echo "   ✔ nowly-windows.zip"
fi
echo ""

if [ -f "$DIST_DIR/nowly-host-linux" ]; then
  echo ">> Creating Linux archive..."
  cd "$DIST_DIR"
  tar -czf "$RELEASE_DIR/nowly-linux.tar.gz" nowly-host-linux
  echo "   ✔ nowly-linux.tar.gz"
fi
echo ""

MACOS_FILES=""
[ -f "$DIST_DIR/nowly-host-darwin" ] && MACOS_FILES="$MACOS_FILES nowly-host-darwin"
[ -f "$DIST_DIR/nowly-host-darwin-arm64" ] && MACOS_FILES="$MACOS_FILES nowly-host-darwin-arm64"

if [ -n "$MACOS_FILES" ]; then
  echo ">> Creating macOS archive..."
  cd "$DIST_DIR"
  # shellcheck disable=SC2086
  tar -czf "$RELEASE_DIR/nowly-macos.tar.gz" $MACOS_FILES
  echo "   ✔ nowly-macos.tar.gz"
fi
echo ""

echo ">> Generating latest.json..."

sha256_file() {
  if command -v sha256sum &>/dev/null; then
    sha256sum "$1" | cut -d' ' -f1
  elif command -v shasum &>/dev/null; then
    shasum -a 256 "$1" | cut -d' ' -f1
  else
    echo "unknown"
  fi
}

file_size() {
  wc -c < "$1" | tr -d ' '
}

RELEASED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$RELEASE_DIR/latest.json" <<EOF
{
  "version": "$VERSION",
  "releasedAt": "$RELEASED_AT",
  "windows": {
    "installer": {
      "url": "https://cdn.nowly.me/installer/nowly-setup.exe",
      "sha256": "$([ -f "$RELEASE_DIR/nowly-setup.exe" ] && sha256_file "$RELEASE_DIR/nowly-setup.exe" || echo "")",
      "size": $([ -f "$RELEASE_DIR/nowly-setup.exe" ] && file_size "$RELEASE_DIR/nowly-setup.exe" || echo 0)
    },
    "portable": {
      "url": "https://cdn.nowly.me/installer/nowly-windows.zip",
      "sha256": "$([ -f "$RELEASE_DIR/nowly-windows.zip" ] && sha256_file "$RELEASE_DIR/nowly-windows.zip" || echo "")",
      "size": $([ -f "$RELEASE_DIR/nowly-windows.zip" ] && file_size "$RELEASE_DIR/nowly-windows.zip" || echo 0)
    }
  },
  "linux": {
    "archive": {
      "url": "https://cdn.nowly.me/installer/nowly-linux.tar.gz",
      "sha256": "$([ -f "$RELEASE_DIR/nowly-linux.tar.gz" ] && sha256_file "$RELEASE_DIR/nowly-linux.tar.gz" || echo "")",
      "size": $([ -f "$RELEASE_DIR/nowly-linux.tar.gz" ] && file_size "$RELEASE_DIR/nowly-linux.tar.gz" || echo 0)
    }
  },
  "macos": {
    "archive": {
      "url": "https://cdn.nowly.me/installer/nowly-macos.tar.gz",
      "sha256": "$([ -f "$RELEASE_DIR/nowly-macos.tar.gz" ] && sha256_file "$RELEASE_DIR/nowly-macos.tar.gz" || echo "")",
      "size": $([ -f "$RELEASE_DIR/nowly-macos.tar.gz" ] && file_size "$RELEASE_DIR/nowly-macos.tar.gz" || echo 0)
    }
  }
}
EOF
echo "   ✔ latest.json"
echo ""

echo "=== Release v$VERSION ready ==="
echo "Output: $RELEASE_DIR"
echo ""
ls -lh "$RELEASE_DIR/"
