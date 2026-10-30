# Shared activity page

`/activities/<32 lowercase hex id>` (noindex) previews a public custom activity and lets the recipient install it through the extension.

## Rules

- Opening the page never installs, updates, activates or writes anything; only an explicit recipient action does.
- The preview mirrors the extension's `buildCustomPresence` and `LiveCard` rules; pure layout, image and clock rules live in `activity-preview.ts` (tested). Show embedded images directly and external images as plain no-referrer images, never through the server or the Next image proxy.
- Exactly one recipient action in the frame footer: install, disabled up-to-date, or the update dialog trigger. Keep and replace choices live in that dialog; opening or cancelling it writes nothing. Feedback stays inside the frame (and inside the open dialog on failure).
- Layout follows the homepage hero cards (artwork left, text and timer right, buttons in full-width rows) but flows responsively.

## Bridge trust

- The page sends only `{ id, revision, fingerprint }` for status, plus `{ choice, localFingerprint }` for apply (shared canonical JSON and SHA-256). Never add an activity object, URL, account or device token, or native profile to these messages.
- `postMessage` targets the exact page origin; listeners require that origin and `event.source === window`. The extension re-fetches and verifies the publication itself.
- Status exposes only install state, installed revision, modified flag and local fingerprint. Replace requires the reviewed fingerprint and revision; a changed publication needs a new review, never a silent retry.

## Local verification

Point `NEXT_PUBLIC_API_BASE_URL` at a disposable fixture returning a strict `ActivityPublication` for a synthetic id (`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`). A fixture only proves the preview; install or update evidence needs the built extension with a matching API fixture. Never use personal sessions or real credentials for captures.
