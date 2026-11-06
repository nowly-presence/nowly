# Report conversations

Chat attached to each presence report (API contract: `apps/api/src/features/presence-reports/AGENTS.md`).

- The reporter key (`reporterKey` in `chrome.storage.local`, `background/storage/reports.store.ts`) identifies the device on every request through the `x-reporter-key` header. The account token is added when signed in so the thread follows the account. Losing the key loses access to account-less threads.
- The UI only talks to the background through `REPORT_CREATE`, `REPORT_LIST`, `REPORT_THREAD`, `REPORT_REPLY` and `REPORT_SET_CLOSED` (`background/router/handlers/reports.handlers.ts`). Lists and threads poll every `REPORT_POLL_MS`.
- Creation lives in `features/presence/presence-report-sheet.tsx` (identity and notification choices, pseudo only when the account has a linked Discord). The "Open conversations" section is in `features/activity/reports-section.tsx`; the thread screen is the `report` route.
- Chat building blocks (`message`, `marker`, `questionnaire`, `prompt-input`) are in `components/shared/chat/` so the team side can reuse them. A pending `info_request` renders as a questionnaire until a reporter message answers it (`answerTo`).
- Notification permission and badge are not wired yet (the `notify` choice is stored on the report).

## Team side

- Moderators (`review`) see "Conversations to handle" in Activity (`features/activity/staff-reports-section.tsx`), the list screen (`features/admin/admin-reports-view.tsx`, filters To handle, Waiting, Mine, All) and the staff chat (`features/admin/admin-report-view.tsx`). Staff calls use the account token only (`requestReports({ staff: true })`), never the reporter key.
- The composer (`admin-report-composer.tsx`) is the prompt input with a status selector and a public or internal selector. Sending with a status different from the current one sends `statusTo` with the message (a status-only change is allowed). "Ask for details" sends a message with 2 to 6 `choices`, shown to the reporter as a questionnaire.
- Messages are right-aligned when `authorName` equals the signed-in account name; the reporter shows as the label chosen at creation or "Anonymous". Internal notes are dashed and tagged.
