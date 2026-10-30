# Custom activity

Hand-written activities shown on Discord without a presence script.

## Recipes

- New template: id in `CUSTOM_ACTIVITY_TEMPLATE_IDS`, entry in `CUSTOM_ACTIVITY_TEMPLATES`, `custom.template.<id>.{name,details,state}` in every locale. Keep nine templates plus Blank (five full picker rows); saved activities and keys of removed templates must stay valid.
- New field: `CustomActivity` (`shared/types/custom-activity.ts`), `emptyCustomActivityDraft`, `validateCustomActivity` and `buildCustomPresence` (`shared/custom-activity.ts`, tested), the matching `custom-activity-*-section.tsx` (errors through `FieldError`) and the preview seed (`preview/preview-fixtures.ts`).

## Rules

- Local only: never account-synced; only uploaded images reach the API (keyed by SHA-256, device token). Activation and uploads stop while legal confirmations are pending.
- One active activity at a time; it wins over tab presences and `currentActivity.slug` becomes `custom:<id>`.
- Discord always shows elapsed time: `startTime` is always sent (from activation) and a countdown adds `endTime` (presets and a 5-minute stepper, never a free input). `LiveCard` mirrors Discord's layout per activity type.
- Icon images are drawn locally (`CustomActivityGlyph`) and by the web route `/api/activity-icon/...`: keep both identical and bump `CUSTOM_ICON_RENDER_VERSION` when the drawing changes. Palette or icon set changes also change the web route.
- Uploads are resized in the panel, re-checked in the background (magic bytes, size) and kept locally; the UI always shows the local copy and Discord gets the CDN URL. The background keeps CDN copies alive and re-uploads them when gone.
- Export and import (`shared/custom-activity-share.ts`) use the saved activity, never unsaved edits, and exclude local ids, dates, active state and CDN URLs. Imports create fresh inactive activities. File drop listens only while the Custom tab is visible with no pushed route, sheet or running import.

## Public links

- Publishing reads the saved activity in the background, never the React draft, and needs an explicit Discord `creator` grant from the website (a sync token is not enough, unsigned native profiles never authorize). Opening the dialog never connects or publishes.
- Update is enabled only when saved portable content differs from the public revision. A revision conflict never auto-retries. Unpublish keeps the id and never touches recipients' copies.
- Deletion goes through the read-only plan (`GET_CUSTOM_ACTIVITY_DELETION_PLAN`): a linked source first needs an explicit withdrawal step, then a separate delete confirmation. Never withdraw or delete automatically; offline or unresolved states stay blocked.
- Recipient provenance (publication id, revision, baseline) stays local; public installs strip detection and never activate a copy. Open editors block replacement and editor saves reject stale drafts.
- UI decisions: sharing opens `custom-activity-publication-dialog.tsx` (a sheet, not an inline card) and Save stays in the header; missing permission is a neutral Discord-required state with one Connect action, never an error or a disabled Publish; Copy and Open form one group beside the URL; withdrawal is an outlined button below Publish or Update; a successful withdrawal closes the sheet with a toast, failures stay inline; a synchronous lock rejects duplicate clicks; the deletion sheet mounts only once its plan is ready.
- The preview mocks publishing only: its links are not real publications.

## Verifying in a real build

The tab value is `custom`. Set `chrome.storage.local.sidepanelActiveView` to `custom` (and remove a stale `sidepanelPendingNav`) before opening `sidepanel/index.html`, or write `sidepanelPendingNav: { view: "custom", at: Date.now() }` for a mounted panel. The list mounts only after current legal acceptance and completed onboarding: complete them through the UI in a disposable profile, never bypass consent in a personal one.
