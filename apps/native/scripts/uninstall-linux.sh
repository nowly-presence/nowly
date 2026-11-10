#!/usr/bin/env bash
set -euo pipefail

HOST_NAME="nowly.client"
BINARY_NAME="nowly-host"
INSTALL_DIR="${HOME}/.local/share/NowlyClient"
MANIFEST_DIRS=(
  "${HOME}/.config/google-chrome/NativeMessagingHosts"
  "${HOME}/.config/chromium/NativeMessagingHosts"
  "${HOME}/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts"
  "${HOME}/.config/microsoft-edge/NativeMessagingHosts"
  "${HOME}/.config/vivaldi/NativeMessagingHosts"
  "${HOME}/.config/opera/NativeMessagingHosts"
  "${HOME}/.mozilla/native-messaging-hosts"
)

echo "Uninstalling Nowly Host..."

for dir in "${MANIFEST_DIRS[@]}"; do
  manifest="${dir}/${HOST_NAME}.json"
  if [ -f "$manifest" ]; then
    rm -f "$manifest"
    echo "  Removed manifest: $manifest"
  fi
done

if [ -f "${INSTALL_DIR}/${BINARY_NAME}" ]; then
  rm -f "${INSTALL_DIR}/${BINARY_NAME}"
  echo "  Removed binary: ${INSTALL_DIR}/${BINARY_NAME}"
fi

rmdir "$INSTALL_DIR" 2>/dev/null || true

echo "Done!"
