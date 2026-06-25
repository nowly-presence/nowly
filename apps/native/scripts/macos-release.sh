#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
RELEASE_DIR="$ROOT_DIR/releases/$VERSION"

# Auto-detect version from git if not provided
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

# Detect the best available source icon
ICON_SOURCE=""
for candidate in \
  "$ROOT_DIR/../../apps/extension/src/icons/icon128.png" \
  "$ROOT_DIR/../../apps/web/public/apple-icon.png" \
  "$ROOT_DIR/../../apps/native/assets/icon.png"; do
  if [ -f "$candidate" ]; then
    ICON_SOURCE="$candidate"
    break
  fi
done

mkdir -p "$RELEASE_DIR"

# --------------- Step 1: Build both binaries ---------------
echo "=== Step 1/6: Build Go binaries ==="
bash "$SCRIPT_DIR/macos-build.sh" "$VERSION"

# --------------- Step 2: Create universal binary ---------------
echo "=== Step 2/6: Create universal binary ==="
UNIVERSAL="$DIST_DIR/nowly-host-darwin-universal"
lipo -create \
  "$DIST_DIR/nowly-host-darwin" \
  "$DIST_DIR/nowly-host-darwin-arm64" \
  -output "$UNIVERSAL"
echo "   ✔ nowly-host-darwin-universal ($(du -h "$UNIVERSAL" | cut -f1))"

# --------------- Step 3: Create .app bundle ---------------
echo "=== Step 3/6: Create .app bundle ==="
bash "$SCRIPT_DIR/macos-bundle.sh" "$VERSION" "universal" "$ICON_SOURCE"

# --------------- Step 3.5: Sign .app (Developer ID) ---------------
# Gated on SIGN_IDENTITY: unset => unsigned build, same as before.
if [ -n "${SIGN_IDENTITY:-}" ]; then
  echo "=== Step 3.5: Sign .app ==="
  bash "$SCRIPT_DIR/macos-sign.sh" "$DIST_DIR/Nowly Host.app"
fi

# --------------- Step 4: Create DMG ---------------
echo "=== Step 4/6: Create DMG ==="
bash "$SCRIPT_DIR/macos-dmg.sh" "universal"

# --------------- Step 4.5: Sign + notarize DMG ---------------
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

# Print SHA-256 hashes
if command -v shasum &>/dev/null; then
  echo "SHA-256:"
  for f in "$RELEASE_DIR"/*; do
    echo "  $(shasum -a 256 "$f" | cut -d' ' -f1)  $(basename "$f")"
  done
fi
