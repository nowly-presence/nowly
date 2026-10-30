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
MONOREPO_ROOT="$(cd "$ROOT_DIR/../.." && pwd)"
RELEASE_DIR="$ROOT_DIR/releases/$VERSION"

echo "=== Publishing Nowly Host v$VERSION to CDN ==="
echo ""

# Check all required files exist
REQUIRED_FILES=(
  "nowly-setup.exe"
  "nowly-windows.zip"
  "nowly-linux.tar.gz"
  "nowly-macos.tar.gz"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$RELEASE_DIR/$file" ]; then
    echo "   ✖ Missing: $RELEASE_DIR/$file"
    echo ""
    echo "Build the release first:"
    echo "  make release HOST_VERSION=$VERSION"
    exit 1
  fi
done

echo "   ✔ All artifacts found in releases/$VERSION/"
echo ""

# Publish to CDN via the private internal CLI (separate repository).
INTERNAL_CLI_DIR="${INTERNAL_CLI_DIR:-$MONOREPO_ROOT/packages/internal-cli}"
if [ ! -d "$INTERNAL_CLI_DIR/node_modules" ]; then
  echo "   ✖ internal-cli not ready at $INTERNAL_CLI_DIR"
  echo ""
  echo "Clone nowly-presence/internal-cli there and run npm install, or set INTERNAL_CLI_DIR."
  exit 1
fi
cd "$INTERNAL_CLI_DIR"

npx tsx index.ts host:publish \
  --release-version "$VERSION" \
  --installer "$RELEASE_DIR/nowly-setup.exe" \
  --portable "$RELEASE_DIR/nowly-windows.zip" \
  --linux "$RELEASE_DIR/nowly-linux.tar.gz" \
  --macos "$RELEASE_DIR/nowly-macos.tar.gz"

echo ""
echo "=== Done! v$VERSION published to CDN ==="
