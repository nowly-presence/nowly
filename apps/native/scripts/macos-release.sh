#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
RELEASE_DIR="$ROOT_DIR/releases/$VERSION"

if [ -z "$VERSION" ]; then
  if git describe --tags --match "native-v*" --always &>/dev/null 2>/dev/null; then
    VERSION="$(git describe --tags --match "native-v*" --always 2>/dev/null | sed 's/^native-v//')"
  else
    VERSION="0.0.0-dev"
  fi
fi

echo "=============================================="
echo "  Nowly Native Host macOS Release v$VERSION"
echo "=============================================="
echo ""

ICON_SOURCE=""
ICON_TMP="$(mktemp "${TMPDIR:-/tmp}/nowly-brand-icon.XXXXXX.png")"
if curl -fsSL "https://cdn.nowly.me/brand/favicons/favicon-192.png" -o "$ICON_TMP"; then
  ICON_SOURCE="$ICON_TMP"
elif [ -f "$ROOT_DIR/assets/icon.png" ]; then
  ICON_SOURCE="$ROOT_DIR/assets/icon.png"
fi

mkdir -p "$RELEASE_DIR"

echo "=== Step 1/6: Build Go binaries ==="
bash "$SCRIPT_DIR/macos-build.sh" "$VERSION"

echo "=== Step 2/6: Create universal binary ==="
UNIVERSAL="$DIST_DIR/nowly-host-darwin-universal"
lipo -create \
  "$DIST_DIR/nowly-host-darwin" \
  "$DIST_DIR/nowly-host-darwin-arm64" \
  -output "$UNIVERSAL"
echo "   ✔ nowly-host-darwin-universal ($(du -h "$UNIVERSAL" | cut -f1))"

echo "=== Step 3/6: Create .app bundle ==="
bash "$SCRIPT_DIR/macos-bundle.sh" "$VERSION" "universal" "$ICON_SOURCE"

if [ -n "${SIGN_IDENTITY:-}" ]; then
  echo "=== Step 3.5: Sign .app ==="
  bash "$SCRIPT_DIR/macos-sign.sh" "$DIST_DIR/Nowly Host.app"
fi

echo "=== Step 4/6: Create DMG ==="
bash "$SCRIPT_DIR/macos-dmg.sh" "universal"

if [ -n "${SIGN_IDENTITY:-}" ]; then
  echo "=== Step 4.5: Sign + notarize DMG ==="
  bash "$SCRIPT_DIR/macos-sign.sh" "$DIST_DIR/NowlyHost-macos.dmg"
fi

cp "$DIST_DIR/NowlyHost-macos.dmg" "$RELEASE_DIR/"

echo ""
echo "=== macOS Release v$VERSION complete ==="
echo "Output: $RELEASE_DIR"
echo ""
ls -lh "$RELEASE_DIR/"
echo ""

if command -v shasum &>/dev/null; then
  echo "SHA-256:"
  for f in "$RELEASE_DIR"/*; do
    echo "  $(shasum -a 256 "$f" | cut -d' ' -f1)  $(basename "$f")"
  done
fi
