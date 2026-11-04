# Creator

Lets someone who does not code build a presence from the side panel: visuals, identity, language, descriptions, detected pages, then review and submission. Opened from the library ("Your site isn't here?", or the dock drop button while the library is open). Design: `apps/extension/docs/presence-creator/design.md`. Back-end guide: `apps/extension/docs/presence-creator/README.md`.

## How it fits together

- The draft is declarative data (`packages/presence-creator/src/creator-types.ts`), saved in `chrome.storage.local` under `creatorDrafts` (`shared/creator/creator-storage.ts`, autosave via `use-draft-editor.ts`). Images are stored as data URLs already cropped to the CI sizes (1920x1080 JPG, 300x300 PNG, 128x128 PNG), so a few drafts fit in the 10 MB local quota.
- `@nowly/presence-creator` (`packages/presence-creator`) is pure and shared with the API: `creator-files.ts` (metadata.json, locales), `creator-codegen.ts` (presence.ts and settings.ts, new SDK format: `new Presence()` and settings default-exported from settings.ts), `creator-validation.ts` (issues per step), `creator-activity.ts` (page matching, templates, preview activity), `creator-export.ts` (text files and definition). The zip (`shared/creator/creator-zip.ts`, fflate) and the DOM, selector and storage modules stay in the extension. Keep the package free of UI and chrome.* so the API can reuse it to regenerate files server-side.
- Page elements are read in the tab by the content script (`content/creator-picker.ts`) through `CREATOR_PICK_START`, `CREATOR_EXTRACT` and `CREATOR_HIGHLIGHT`. `CREATOR_TEST_ACTIVITY` pushes the preview to Discord while testing and restores the normal activity on stop.
- Sign-in is the Nowly account (Better Auth, Discord only) and is required to submit. The token needs the explicit `creator` scope, granted on nowly.me through `START_CREATOR_CONNECT` (the same grant as public activities); a sync-only account sees "Allow publishing". `CREATOR_GET_ACCOUNT` returns the user and whether the scope is there.
- The account is the only source of the author (`authorFromAccount`, `packages/presence-creator/src/creator-submission.ts`): `author.discord` is the Discord id. There is no author field and no sign-out in the creator (the account is managed in Settings). `CreatorAuthor.github` stays in the type for a later GitHub provider.
- Submissions go through the background (`background/services/creator-api.ts`): `POST /me/presence-submissions` and `GET /me/presence-submissions?ids=`, with the account bearer token. These routes do not exist yet; a 404 shows "not available yet" and the zip export stays available. 401 or 403 means the scope is missing.

- Drafts saved by older builds are upgraded on load by `normalizeDraft` (`creator-draft.ts`); extend it whenever a field changes shape.

## Change what the generator produces

1. Edit `packages/presence-creator/src/creator-codegen.ts` (or `creator-files.ts`) and keep `shared/creator/creator-dom.ts` in sync: the live test reads the page with the DOM module, the published presence with the generated helpers, and both must give the same values.
2. Update `packages/presence-creator/src/creator.test.ts`.
3. Check the output against the real SDK: generate the sample draft (`creator-fixtures.ts`) into a copy of the presences repo next to `packages/sdk`, then run its `tsc`, `scripts/validate-locales.ts` and `metadata.schema.json`.

## Add a step or a field

1. Add the data to `CreatorDraft` and its default in `createDraft` (`creator-draft.ts`).
2. Add validation codes in `creator-validation.ts`, their message keys in `creator-issue-list.tsx` and every `apps/extension/messages/*.json`.
3. For a new step: add it to `CREATOR_STEPS`, give it an icon and texts in `STEP_META` (`creator-wizard.tsx`) and a component in `steps/`.

## Gotchas

- The creator view is lazy-loaded like the other routes. The wizard is a focused flow: the dock is hidden while the `creator` route is on top (`entrypoints/sidepanel/app.tsx`), otherwise it covers the sticky "Continue" button.
- The header "Back" goes to the previous step (to the drafts list on the first one). The footer (padded at the bottom by `StepLayout` itself, not by the page) pairs "Continue later" (saves and leaves) with "Next step", which stays disabled while the current step has issues; the review step lists each step with its issue count and an edit action.
- Template inputs (`pages/template-input.tsx`) end with an "Insert" menu (`ui/menu-button.tsx`) listing the page elements with their current value; it inserts at the caret. `TemplateFields framed` groups several of them (first and second line).
- While a page is being edited, the wizard owns `editingPageId`: the footer primary button becomes "Save this page" (back to the list), the header "Back" also returns to the list, and the footer only lists that page's issues.
- Image cards show the size badge top right (green once the image is resized), replace on click with a hover hint, and remove with the round button on the image.
- The language being edited is remembered per scope (`"texts"`, `page:<id>`) by `EditLocaleProvider` (`creator-locale-tabs.tsx`), so going back to a step shows the tab you left, while a new page starts in the writing language. In a translation tab every field shows the writing-language text as placeholder.
- Images and button links share `pages/url-source-field.tsx`: default (logo or current page), a picked element (the picker adds the variable itself), or a custom `https://` template filled with `{variables}` (`fillUrl` in the preview, a template literal in the generated code; the image or button is skipped while a value is missing).
- Timestamps are always shown (Discord adds a timer anyway): time on the page by default, or the player progress, falling back to time on the page when there is no media element.
- Issue messages have no language or trailing period; `CreatorIssueList` appends the language only when the draft is written in several.
- Variable names are ASCII identifiers (`toIdentifier`), used as `{name}` in templates and as `formatString` params in the generated code. Non-Latin input becomes empty, hence the "letters and numbers only" hint.
- The content script only exists in tabs loaded after the extension was installed or updated; `UNREACHABLE` asks the user to reload the page.
- In the preview (signed out unless `?account=in`), picking and extraction are mocked (`preview/mock-creator.ts`), "Allow" grants the scope to the mocked account and each "Refresh status" moves the submission one step forward.

- The page editor is a stack of `ui/frame.tsx` sections (page, elements, texts, image, buttons, duration, test): title and description in the header, adds on the right of the header, a footer only when it really needs an action. Choices with few options use `ui/option-cards.tsx` (activity type, duration, image and link source).
- A page has up to 2 buttons (`CreatorPage.buttons`, `BUTTONS_MAX`), each edited in a sheet. Older drafts and definitions with the single `button` are upgraded by `normalizeDraft` and `parseCreatorDefinition`.
- "Send again" stays disabled until the draft differs from what was sent: `draft.sentSignature` (`shared/creator/creator-signature.ts`) is stored on each successful send. Drafts without it can be sent once.
- The submission panel shows the reviewer comment of the latest round when the draft is rejected or needs changes, the timeline otherwise, and earlier reviews behind "Review history". "Version" is reserved for published presences: reviews say "Submission n", shown only when there is more than one.

## Draft synchronisation

Drafts follow the account across devices (token scope `creator`). The background service `background/services/creator-drafts-sync.ts` merges `chrome.storage.local["creatorDrafts"]` with `/me/creator-drafts` by `updatedAt` (last writer wins, plan in `shared/creator/creator-draft-sync-plan.ts`). Local deletions are kept as tombstones (`creatorDraftTombstones`) until the server confirms them. Submission statuses are refreshed from `/me/presence-submissions` after each merge without touching `updatedAt`. Triggers: opening the creator (`CREATOR_SYNC_DRAFTS`), debounced local changes and the account sync alarm. The server keeps at most 20 live drafts of about 3 MB per account.
