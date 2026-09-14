#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-0.0.0-dev}"
ARCH="${2:-amd64}" # amd64, arm64, or universal
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

BINARY="$DIST_DIR/nowly-host-darwin"
if [ "$ARCH" = "arm64" ]; then
  BINARY="$DIST_DIR/nowly-host-darwin-arm64"
elif [ "$ARCH" = "universal" ]; then
  BINARY="$DIST_DIR/nowly-host-darwin-universal"
fi
APP_NAME="Nowly Host.app"
APP_DIR="$DIST_DIR/$APP_NAME"
APP_BUNDLE_VERSION="$VERSION"

if [ ! -f "$BINARY" ]; then
  echo "ERROR: Binary not found at $BINARY"
  echo "Run macos-build.sh first or provide the correct architecture."
  exit 1
fi

echo ">> Creating .app bundle for macOS ($ARCH)..."
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

cp "$BINARY" "$APP_DIR/Contents/MacOS/nowly-host"
chmod +x "$APP_DIR/Contents/MacOS/nowly-host"

cat > "$APP_DIR/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>nowly-host</string>
    <key>CFBundleIdentifier</key>
    <string>me.nowly.host</string>
    <key>CFBundleName</key>
    <string>Nowly Host</string>
    <key>CFBundleDisplayName</key>
    <string>Nowly Host</string>
    <key>CFBundleVersion</key>
    <string>$APP_BUNDLE_VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$APP_BUNDLE_VERSION</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleIconFile</key>
    <string>icon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

# Generate .icns if iconutil is available (macOS)
ICON_SOURCE="${3:-}"
if [ -z "$ICON_SOURCE" ] || [ ! -f "$ICON_SOURCE" ]; then
  ICON_TMP="$(mktemp "${TMPDIR:-/tmp}/nowly-brand-icon.XXXXXX.png")"
  if curl -fsSL "https://cdn.nowly.me/brand/favicons/favicon-192.png" -o "$ICON_TMP"; then
    ICON_SOURCE="$ICON_TMP"
  elif [ -f "$ROOT_DIR/assets/icon.png" ]; then
    ICON_SOURCE="$ROOT_DIR/assets/icon.png"
  fi
fi
ICONSET_DIR="$APP_DIR/Contents/Resources/icon.iconset"
ICNS_OUTPUT="$APP_DIR/Contents/Resources/icon.icns"

if command -v iconutil &>/dev/null && [ -f "$ICON_SOURCE" ]; then
  echo "   >> Generating .icns from $ICON_SOURCE..."
  mkdir -p "$ICONSET_DIR"

  # sips is available on macOS — generate all required sizes
  sips -z 16 16   "$ICON_SOURCE" --out "$ICONSET_DIR/icon_16x16.png" &>/dev/null
  sips -z 32 32   "$ICON_SOURCE" --out "$ICONSET_DIR/icon_16x16@2x.png" &>/dev/null
  sips -z 32 32   "$ICON_SOURCE" --out "$ICONSET_DIR/icon_32x32.png" &>/dev/null
  sips -z 64 64   "$ICON_SOURCE" --out "$ICONSET_DIR/icon_32x32@2x.png" &>/dev/null
  sips -z 128 128 "$ICON_SOURCE" --out "$ICONSET_DIR/icon_128x128.png" &>/dev/null
  sips -z 256 256 "$ICON_SOURCE" --out "$ICONSET_DIR/icon_128x128@2x.png" &>/dev/null
  sips -z 256 256 "$ICON_SOURCE" --out "$ICONSET_DIR/icon_256x256.png" &>/dev/null
  sips -z 512 512 "$ICON_SOURCE" --out "$ICONSET_DIR/icon_256x256@2x.png" &>/dev/null
  sips -z 512 512 "$ICON_SOURCE" --out "$ICONSET_DIR/icon_512x512.png" &>/dev/null
  sips -z 1024 1024 "$ICON_SOURCE" --out "$ICONSET_DIR/icon_512x512@2x.png" &>/dev/null

  iconutil -c icns "$ICONSET_DIR" -o "$ICNS_OUTPUT"
  rm -rf "$ICONSET_DIR"
  echo "   ✔ icon.icns generated ($(wc -c < "$ICNS_OUTPUT") bytes)"
else
  echo "   ⚠ iconutil not available or source icon missing — skipping .icns generation"
fi

echo "   ✔ $APP_NAME created"
echo ""
