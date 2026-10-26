# Custom activity

"Custom" tab (wrapped by the `custom-activity` feature reveal): activities the user writes by hand (name, type, two lines, large/small image with hover text, timer, up to 2 buttons) and shows on Discord with a switch, no presence script involved. Tab list in `custom-activity-view.tsx`, editor pushed as the `custom-activity` route (`id: null` creates).

## Add a template

1. Add its id to `CUSTOM_ACTIVITY_TEMPLATE_IDS` and its icon, colour, type and timer to `CUSTOM_ACTIVITY_TEMPLATES` (`custom-activity-templates.ts`).
2. Add `custom.template.<id>.{name,details,state}` to every `messages/*.json`.

Templates only prefill the editor (route `custom-activity` with `template`); nothing is saved until the user saves. The "Create" button of the tab header opens the template sheet (with "Blank" first); the empty state has "Create an activity" (blank) and "Use a template".

Keep nine templates plus Blank so the two-column picker has five complete rows. Saved activities and translation keys of removed templates (Focus) must stay valid.

## Add a field

1. Add it to `CustomActivity` (`shared/types/custom-activity.ts`) and its default to `emptyCustomActivityDraft`, its rule to `validateCustomActivity` and its mapping to `buildCustomPresence` (`shared/custom-activity.ts`, covered by tests).
2. Render it in the matching `custom-activity-*-section.tsx` (each takes `CustomActivitySectionProps`), errors through `FieldError`.
3. Mirror it in the preview seed (`preview/preview-fixtures.ts`).

## Share (import and export)

- Export from the editor uses the saved activity, not unsaved edits. `shared/custom-activity-share.ts` builds `{ format: "nowly.custom-activity", version: 1, exportedAt, activity }`, with uploaded images embedded from `GET_CUSTOM_IMAGES`. Missing local copies become `none`. Local ids, creation/update dates, active state and upload CDN URLs are excluded; user-entered HTTPS links remain.
- Import accepts multiple JSON files up to 4 MiB each. The parser validates the format/version, draft and embedded images. Images are uploaded through `UPLOAD_CUSTOM_IMAGE`, then `SAVE_CUSTOM_ACTIVITY` creates a fresh inactive activity. Failed images produce a warning but do not prevent saving; failed files do not stop the batch. One imported activity opens its editor, several show a summary.
- `use-custom-activity-share.ts` locks concurrent imports and stops at remaining capacity. `use-file-drop.ts` listens only while the Custom tab is visible, with no pushed route or template sheet and no import running. Keep that navigation guard: visited tab views stay mounted when hidden.
- `lib/download-json-file.ts` is shared with the device-data export. No extra permission or server route is needed for sharing.

## Gotchas

- Discord lays activities out by type, and `LiveCard` mirrors it: "Playing" shows the header "Playing" then the name, details and state (3 lines); Listening, Watching and Competing put the name in the header ("Listening to {name}", `activity.header.*`) and show only details and state.

- The empty state shows a stack of three non-interactive sample activities that rotate every 4.5 s (not under reduced motion) (`custom-activity-empty-state.tsx`, strings `custom.empty.{study,code,game}*`), all "Playing" with a countdown so every card has the same height and the stack keeps an even edge, built with the same `buildCustomPresence` as real ones, so it always matches what the editor produces.

- Custom activities are local only: not account-synced, not sent to the API except their uploaded images (slug-less, keyed by SHA-256, device token). Activation and image uploads stop while legal confirmations are pending.
- Only one custom activity is active at a time (`CustomActivitiesState.activeId`). While active it wins over tab presences in `broadcastActiveTab`; `currentActivity.slug` is then `custom:<id>` (`customActivitySlug` / `customActivityIdOf`), which the Activity tab checks before looking up installed presences.
- Server routes, cleanup and GDPR support live in `apps/api/src/features/custom-assets/`. The icon route lives in `apps/web`.
- Images have four modes the user picks: upload, https link, icon, none. "Icon" is a colour + icon (`{ kind: "icon" }`) that Discord receives as a generated PNG (`customIconImageUrl`, web route `/api/activity-icon/:icon/:color.png?v=`); the side panel draws it locally with `CustomActivityGlyph`, so both must stay identical (bump `CUSTOM_ICON_RENDER_VERSION` when the drawing changes). "None" on the large image sends the Nowly logo (`BRAND_ICON_PNG`) and shows it in Nowly; on the small image it means no badge. New activities start with a random icon image. Uploads are resized in the side panel (`custom-image-file.ts`, WebP, 1024px then smaller, GIFs untouched), checked again in the background by magic bytes and size (`shared/custom-image.ts`), stored locally as a data URL keyed by SHA-256 (`customActivityImages`, `unlimitedStorage`) and sent to the API. The UI always displays the local copy (`hooks/use-custom-image-data.ts`), Discord gets the CDN URL.
- The CDN drops an upload after 30 days without a touch. The background touches the active activity's images on activation and every 6 hours (`custom-images-keepalive` alarm) when the last touch is over a day old, and re-uploads from the local copy when the API answers 404/410 or the last use is older than 28 days (`customImageSync`). Local copies no longer referenced by any activity are deleted, remotely too.
- Timers start when the activity is switched on (`activatedAt`), not when it was created. There is no "no time" option: Discord always shows the elapsed time of an activity, so `startTime` is always sent ("12:34 elapsed") and "Countdown" adds `endTime`. The countdown is set with presets and a 5-minute stepper (`clampCountdown`, 5 min to 24 h), never a free number input.
- Palette and icon set live in `shared/custom-activity.ts` and `components/shared/custom-activity-artwork.tsx`; changing them also means changing the web icon route.

## Notable dependencies
`GET_CUSTOM_ACTIVITIES`, `SAVE_CUSTOM_ACTIVITY`, `DELETE_CUSTOM_ACTIVITY`, `SET_CUSTOM_ACTIVITY_ACTIVE`, `UPLOAD_CUSTOM_IMAGE`, `GET_CUSTOM_IMAGES`; API `PUT/POST .../touch/DELETE /devices/:deviceId/custom-assets/:sha256` (device token); `components/shared/custom-activity-live-card`.
