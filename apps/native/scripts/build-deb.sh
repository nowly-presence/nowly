#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-0.0.0-dev}"
BINARY_SRC="${2:-dist/nowly-host-linux}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"

HOST_NAME="nowly.client"
PKG_ROOT="$DIST_DIR/deb/nowly-host"
OUTPUT="$DIST_DIR/nowly-host_${VERSION}_amd64.deb"

if [ ! -f "$BINARY_SRC" ]; then
  echo "ERROR: Binary not found at $BINARY_SRC"
  exit 1
fi

echo ">> Building .deb package (v$VERSION)..."
rm -rf "$PKG_ROOT"
mkdir -p "$PKG_ROOT/DEBIAN" "$PKG_ROOT/usr/lib/nowly-client"

cp "$BINARY_SRC" "$PKG_ROOT/usr/lib/nowly-client/nowly-host"
chmod 755 "$PKG_ROOT/usr/lib/nowly-client/nowly-host"

cat > "$PKG_ROOT/DEBIAN/control" <<EOF
Package: nowly-host
Version: $VERSION
Section: net
Priority: optional
Architecture: amd64
Maintainer: Nowly <support@nowly.me>
Homepage: https://nowly.me
Description: Nowly native messaging host
 Local bridge between the Nowly browser extension and Discord Rich Presence.
EOF

cat > "$PKG_ROOT/DEBIAN/postinst" <<'EOF'
#!/bin/sh
set -e

HOST_NAME="nowly.client"
BINARY_PATH="/usr/lib/nowly-client/nowly-host"

CHROME_ORIGINS='["chrome-extension://kmnlnfldimgneaopdihplkebobckcjpf/","chrome-extension://abbegmindbabanjcabnmcjmamaoffbam/"]'
FIREFOX_EXTENSIONS='["{01146c8d-3101-0d92-01dc-29c0c0e5510c}","nowly@nowly.me"]'

install_chrome_manifest() {
  dir="$1"
  mkdir -p "$dir"
  cat > "$dir/${HOST_NAME}.json" <<MANIFEST
{
  "name": "${HOST_NAME}",
  "description": "Nowly Host",
  "path": "${BINARY_PATH}",
  "type": "stdio",
  "allowed_origins": ${CHROME_ORIGINS}
}
MANIFEST
}

install_firefox_manifest() {
  dir="$1"
  mkdir -p "$dir"
  cat > "$dir/${HOST_NAME}.json" <<MANIFEST
{
  "name": "${HOST_NAME}",
  "description": "Nowly Native Messaging Host",
  "path": "${BINARY_PATH}",
  "type": "stdio",
  "allowed_extensions": ${FIREFOX_EXTENSIONS}
}
MANIFEST
}

install_chrome_manifest /etc/opt/chrome/native-messaging-hosts
install_chrome_manifest /etc/chromium/native-messaging-hosts
install_firefox_manifest /usr/lib/mozilla/native-messaging-hosts

exit 0
EOF
chmod 755 "$PKG_ROOT/DEBIAN/postinst"

cat > "$PKG_ROOT/DEBIAN/postrm" <<'EOF'
#!/bin/sh
set -e

HOST_NAME="nowly.client"

if [ "$1" = "remove" ] || [ "$1" = "purge" ]; then
  rm -f "/etc/opt/chrome/native-messaging-hosts/${HOST_NAME}.json"
  rm -f "/etc/chromium/native-messaging-hosts/${HOST_NAME}.json"
  rm -f "/usr/lib/mozilla/native-messaging-hosts/${HOST_NAME}.json"
fi

exit 0
EOF
chmod 755 "$PKG_ROOT/DEBIAN/postrm"

dpkg-deb --build --root-owner-group "$PKG_ROOT" "$OUTPUT"
echo "   OK $OUTPUT created"
