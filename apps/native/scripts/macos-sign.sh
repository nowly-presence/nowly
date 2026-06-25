#!/usr/bin/env bash
set -euo pipefail

# Sign (and optionally notarize + staple) a built .app or .dmg for Developer ID distribution.
#
# Required env:
#   SIGN_IDENTITY   Developer ID Application identity, e.g.
#                   "Developer ID Application: Your Name (TEAMID)"
#                   List yours with: security find-identity -v -p codesigning
#
# Optional env (omit to sign only, skip notarization):
#   NOTARY_PROFILE  notarytool keychain profile name. Create it once with:
#                     xcrun notarytool store-credentials <name> \
#                       --apple-id <apple-id> --team-id <TEAMID> --password <app-specific-pw>
#                   (app-specific password from https://appleid.apple.com)
#
# Usage: macos-sign.sh <path-to-.app-or-.dmg>

TARGET="${1:?usage: macos-sign.sh <path-to-.app-or-.dmg>}"
: "${SIGN_IDENTITY:?set SIGN_IDENTITY (e.g. 'Developer ID Application: Name (TEAMID)')}"

case "$TARGET" in
  *.app)
    echo ">> Signing app (hardened runtime + secure timestamp): $TARGET"
    # No --entitlements file needed; a plain Go agent has no hardened-runtime
    # exceptions. Add one (allow-jit etc.) only if a runtime restriction ever bites.
    codesign --force --timestamp --options runtime --sign "$SIGN_IDENTITY" "$TARGET"
    codesign --verify --strict --verbose=2 "$TARGET"
    ;;
  *.dmg)
    echo ">> Signing dmg: $TARGET"
    codesign --force --timestamp --sign "$SIGN_IDENTITY" "$TARGET"
    ;;
  *)
    echo "ERROR: unsupported target (need .app or .dmg): $TARGET" >&2
    exit 1
    ;;
esac

if [ -z "${NOTARY_PROFILE:-}" ]; then
  echo ">> Signed (NOTARY_PROFILE unset, skipped notarization): $TARGET"
  exit 0
fi

echo ">> Notarizing via profile '$NOTARY_PROFILE' (waits for Apple)..."
case "$TARGET" in
  *.app)
    ZIP="${TARGET%.app}-notarize.zip"
    ditto -c -k --keepParent "$TARGET" "$ZIP"
    xcrun notarytool submit "$ZIP" --keychain-profile "$NOTARY_PROFILE" --wait
    rm -f "$ZIP"
    ;;
  *.dmg)
    xcrun notarytool submit "$TARGET" --keychain-profile "$NOTARY_PROFILE" --wait
    ;;
esac

xcrun stapler staple "$TARGET"
echo ">> Notarized + stapled: $TARGET"
