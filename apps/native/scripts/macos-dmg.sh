#!/usr/bin/env bash
set -euo pipefail

ARCH="${1:-amd64}" # amd64, arm64, or universal
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

ARCH_TAG=""
if [ "$ARCH" = "amd64" ]; then
  ARCH_TAG="-amd64"
elif [ "$ARCH" = "arm64" ]; then
  ARCH_TAG="-arm64"
fi

APP_NAME="Nowly Host.app"
APP_DIR="$DIST_DIR/$APP_NAME"
DMG_NAME="NowlyHost-macos$ARCH_TAG.dmg"
DMG_PATH="$DIST_DIR/$DMG_NAME"
STAGING_DIR="$DIST_DIR/dmg-staging"

if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: .app bundle not found at $APP_DIR"
  echo "Run macos-bundle.sh first."
  exit 1
fi

echo ">> Creating DMG for macOS ($ARCH)..."

rm -f "$DMG_PATH"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

cp -R "$APP_DIR" "$STAGING_DIR/"
ln -s /Applications "$STAGING_DIR/Applications"

STAGING_SIZE_MB=$(du -sm "$STAGING_DIR" | cut -f1)
DMG_SIZE_MB=$((STAGING_SIZE_MB + 10))

hdiutil create -size "${DMG_SIZE_MB}m" \
  -fs HFS+ \
  -volname "Nowly Host" \
  -srcfolder "$STAGING_DIR" \
  -format UDZO \
  -imagekey zlib-level=9 \
  "$DMG_PATH" &>/dev/null

rm -rf "$STAGING_DIR"

echo "   ✔ $DMG_NAME created ($(du -h "$DMG_PATH" | cut -f1))"
echo ""
