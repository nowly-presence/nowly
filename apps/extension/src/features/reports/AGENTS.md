# Report conversations

Chat attached to each presence report (API contract: `apps/api/src/features/presence-reports/AGENTS.md`).

- The reporter key (`reporterKey` in `chrome.storage.local`, `background/storage/reports.store.ts`) identifies the device on every request through the `x-reporter-key` header. The account token is added when signed in so the thread follows the account. Losing the key loses access to account-less threads.
- The UI only talks to the background through `REPORT_CREATE`, `REPORT_LIST`, `REPORT_THREAD`, `REPORT_REPLY` and `REPORT_SET_CLOSED` (`background/router/handlers/reports.handlers.ts`). Lists and threads poll every `REPORT_POLL_MS`.
- Creation lives in `features/presence/presence-report-sheet.tsx` (identity and notification choices, pseudo only when the account has a linked Discord). The "Open conversations" section is in `features/activity/reports-section.tsx`; the thread screen is the `report` route.
- Chat building blocks (`message`, `marker`, `questionnaire`, `prompt-input`) are in `components/shared/chat/` so the team side can reuse them. A pending `info_request` renders as a questionnaire until a reporter message answers it (`answerTo`).
- Notification permission and badge are not wired yet (the `notify` choice is stored on the report).
