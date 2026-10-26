# Custom activity

"Custom" tab (2.4.0): activities the user writes by hand (name, type, two lines, large/small image with hover text, timer, up to 2 buttons) and shows on Discord with a switch, no presence script involved. Tab list in `custom-activity-view.tsx`, editor pushed as the `custom-activity` route (`id: null` creates).

## Add a template

1. Add its id to `CUSTOM_ACTIVITY_TEMPLATE_IDS` and its icon, colour, type and timer to `CUSTOM_ACTIVITY_TEMPLATES` (`custom-activity-templates.ts`).
2. Add `custom.template.<id>.{name,details,state}` to every `messages/*.json`.

Templates only prefill the editor (route `custom-activity` with `template`); nothing is saved until the user saves. The "Create" button of the tab header opens the template sheet (with "Blank" first); the empty state has "Create an activity" (blank) and "Use a template".

Keep nine templates plus Blank so the two-column picker has five complete rows. Focus is no longer offered; existing saved activities and its translation keys are preserved.

## Add a field

1. Add it to `CustomActivity` (`shared/types/custom-activity.ts`) and its default to `emptyCustomActivityDraft`, its rule to `validateCustomActivity` and its mapping to `buildCustomPresence` (`shared/custom-activity.ts`, covered by tests).
2. Render it in the matching `custom-activity-*-section.tsx` (each takes `CustomActivitySectionProps`), errors through `FieldError`.
3. Mirror it in the preview seed (`preview/preview-fixtures.ts`).

## Share (import and export)

- Export from the editor uses the saved activity, not unsaved edits. `shared/custom-activity-share.ts` builds `{ format: "nowly.custom-activity", version: 1, exportedAt, activity }`, with uploaded images embedded from `GET_CUSTOM_IMAGES`. Missing local copies become `none`. Local ids, creation/update dates, active state and upload CDN URLs are excluded; user-entered HTTPS links remain.
- Import accepts multiple JSON files up to 4 MiB each. The parser validates the format/version, draft and embedded images. Images are uploaded through `UPLOAD_CUSTOM_IMAGE`, then `SAVE_CUSTOM_ACTIVITY` creates a fresh inactive activity. Failed images produce a warning but do not prevent saving; failed files do not stop the batch. One imported activity opens its editor, several show a summary.
- `use-custom-activity-share.ts` locks concurrent imports and stops at remaining capacity. `use-file-drop.ts` listens only while the Custom tab is visible, with no pushed route or template sheet and no import running. Keep that navigation guard: visited tab views stay mounted when hidden.
- `lib/download-json-file.ts` is shared with the device-data export. No extra permission or server route is needed for sharing.

## Public links

- Saved editors offer a bottom sharing button opening `custom-activity-publication-dialog.tsx`, not an inline publication card. Save remains in the header only. Export and Delete are neutral filled actions below sharing; deletion still requires confirmation. Publishing reads the saved activity in the background, never the unsaved React draft. Its reveal id is `custom-public-sharing` on release line 2.5.0. The existing JSON export/import is unchanged.
- The sharing drawer reuses the same Sheet primitive as Support Nowly. Its left-aligned layout previews the saved activity and connected Discord author. Published links have a read-only URL and explicit Copy action. Withdrawal uses an outlined secondary button below the primary Publish/Update action, including unfinished reservations. The feature reveal retains full saved-content and detection-exclusion details. Saving local edits alone never updates the public link. Update is disabled until the background confirms saved portable content differs from the current public revision. Local detection, timestamps and unsaved drafts do not count. An unavailable comparison disables Update without blocking withdrawal. The existing Sheet supplies backdrop dismissal, Escape dismissal and focus restoration.
- Missing publishing permission shows a neutral Discord-required empty state with one Connect Discord action, not a red error or disabled Publish button. Ready/public states show Publish/Update respectively. Public links and Unpublish live in the dialog; Unpublish remains available for unfinished revision-zero reservations and withdrawn links. Unexpected errors remain visible. Opening the dialog never connects or publishes automatically. Presentation transport state lives in `custom-activity-publication-hook.ts`.
- Publishing requires an explicit Discord `creator` grant through the website's Connect button. A sync-only token is insufficient. Verified server account identity supplies the public author; native PONG profiles are unsigned and never authorize publication.
- The owner metadata lookup restores link/revision state when reopening the editor. A revision conflict never auto-retries; reopen and review before another explicit publish. Unpublish preserves the stable id for republication and never deletes recipients' independent copies.
- Before publication, the background reserves a private revision-zero server-generated link and durably stores its id and original API base before PUT. Lost reservation responses cannot publish; lost PUT responses retain the known reference. Account changes never discard this history.
- Deletion never silently unpublishes. Cancel a blocked deletion, choose Unpublish link in the Public link section, then delete. This explicit action is available for unfinished reservations and unpublished links too: its conditional revision increment invalidates a delayed PUT. Ordinary deletion requires successful withdrawal plus fresh owner-authenticated matching unpublished revision. Offline, unknown records and unresolved attempts remain blocked. Never-published activities still delete offline.
- After account erasure, including reconnecting the same Discord identity as a new user, fresh structured public `NOT_FOUND` for every recorded id on the original API proves that all rows are missing. Old owner credentials are not needed. `UNPUBLISHED` alone never proves erasure or invalidates an in-flight publish. If API configuration changed, restore the original configuration before retrying. No request or token is sent to a recorded URL. This is local source recovery, not an account-existence lookup or automatic remote mutation.
- Recipient provenance is local (`publicationId`, installed revision and canonical portable baseline). It excludes local ids/dates, CDN touches and active runtime state. Automatic detection is stripped from publications and cleared on every public install/replace. Neither operation activates a copy.
- Existing editors register through `lib/custom-activity-editor-messages.ts` before enabling editable fields. The hook owns React readiness only; the transport owns ports and reconnection. All open editors conservatively block replacement, even before the draft becomes dirty. Editor saves carry their original `updatedAt` and reject stale drafts instead of overwriting a reviewed replacement or another save.
- Preview runtime mocks publishing only. Its generated links are illustrative, not server publications. It does not claim recipient install/update success.

- The Discord connection state uses a centered invitation with a filled Discord icon and explicit Connect action. Its title and description form a compact group, with extra space between the description and Connect button, not below the button. Sharing drawers omit the italic notice. Creation and update keep the saved preview layout, with state-specific drawer titles and descriptions. The editor sharing entry also switches to the update label after owner metadata confirms a published link, refreshing when the drawer closes. Discord fallback icons have a rounded muted background. Copy and Open form a joint button group beside the URL, never between Update and Withdraw.

## Gotchas

- Discord lays activities out by type, and `LiveCard` mirrors it: "Playing" shows the header "Playing" then the name, details and state (3 lines); Listening, Watching and Competing put the name in the header ("Listening to {name}", `activity.header.*`) and show only details and state.

- The empty state shows a stack of three non-interactive sample activities that rotate every 4.5 s (not under reduced motion) (`custom-activity-empty-state.tsx`, strings `custom.empty.{study,code,game}*`), all "Playing" with a countdown so every card has the same height and the stack keeps an even edge, built with the same `buildCustomPresence` as real ones, so it always matches what the editor produces.

- Only one custom activity is active at a time (`CustomActivitiesState.activeId`). While active it wins over tab presences in `broadcastActiveTab`; `currentActivity.slug` is then `custom:<id>` (`customActivitySlug` / `customActivityIdOf`), which the Activity tab checks before looking up installed presences.
- Server routes, cleanup and GDPR support live in `apps/api/src/features/custom-assets/`. The icon route already exists in `apps/web`. Deployment decisions are described in `apps/extension/docs/custom-activity/README.md`.
- Images have four modes the user picks: upload, https link, icon, none. "Icon" is a colour + icon (`{ kind: "icon" }`) that Discord receives as a generated PNG (`customIconImageUrl`, web route `/api/activity-icon/:icon/:color.png?v=`); the side panel draws it locally with `CustomActivityGlyph`, so both must stay identical (bump `CUSTOM_ICON_RENDER_VERSION` when the drawing changes). "None" on the large image sends the Nowly logo (`BRAND_ICON_PNG`) and shows it in Nowly; on the small image it means no badge. New activities start with a random icon image. Uploads are resized in the side panel (`custom-image-file.ts`, WebP, 1024px then smaller, GIFs untouched), checked again in the background by magic bytes and size (`shared/custom-image.ts`), stored locally as a data URL keyed by SHA-256 (`customActivityImages`, `unlimitedStorage`) and sent to the API. The UI always displays the local copy (`hooks/use-custom-image-data.ts`), Discord gets the CDN URL.
- The CDN drops an upload after 30 days without a touch. The background touches the active activity's images on activation and every 6 hours (`custom-images-keepalive` alarm) when the last touch is over a day old, and re-uploads from the local copy when the API answers 404/410 or the last use is older than 28 days (`customImageSync`). Local copies no longer referenced by any activity are deleted, remotely too.
- Timers start when the activity is switched on (`activatedAt`), not when it was created. There is no "no time" option: Discord always shows the elapsed time of an activity, so `startTime` is always sent ("12:34 elapsed") and "Countdown" adds `endTime`. The countdown is set with presets and a 5-minute stepper (`clampCountdown`, 5 min to 24 h), never a free number input.
- Palette and icon set live in `shared/custom-activity.ts` and `components/shared/custom-activity-artwork.tsx`; changing them also means changing the icon route (see the README).

## Notable dependencies
`GET_CUSTOM_ACTIVITIES`, `SAVE_CUSTOM_ACTIVITY`, `DELETE_CUSTOM_ACTIVITY`, `SET_CUSTOM_ACTIVITY_ACTIVE`, `UPLOAD_CUSTOM_IMAGE`, `GET_CUSTOM_IMAGES`; API `PUT/POST .../touch/DELETE /devices/:deviceId/custom-assets/:sha256` (device token); `components/shared/custom-activity-live-card`.

## Real built-extension navigation

The actual tab value is `custom` (not `custom-activity`, which is an editor route). Before opening or reloading the real `sidepanel/index.html`, set `chrome.storage.local.sidepanelActiveView` to `custom` and remove stale `sidepanelPendingNav`. For a panel already mounted, write `sidepanelPendingNav: { view: "custom", at: Date.now() }`; changing only the persisted tab does not navigate an already mounted provider.

The real list is inside `[data-tab="custom"]`; select its visible activity row by the installed activity name. In English the header is `Custom activities`. Click that row to open its editor, then wait for `input` controls to be enabled after the editor-port readiness acknowledgement. If the panel never shows tabs, check the existing legal gate and onboarding first: the list is not mounted until legal acceptance is current and `onboarding.onboardingCompleted` is true. Complete these through the actual UI in a disposable profile; do not bypass legal consent in a personal profile. Missing native host does not prevent the custom activity list.
