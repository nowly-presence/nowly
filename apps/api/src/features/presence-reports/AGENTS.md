# Presence reports

Conversation attached to each presence report (replaces the one-way Discord webhook; the webhook route `POST /presences/:slug/report` stays for old extension builds).

## Model

- `presence_reports`: one thread per report. Status `new`, `in_progress`, `info_requested`, `fixed`, `closed` (`report.constants.ts`). `secret_hash` is the sha256 of the reporter key the extension generates and keeps locally; `reporter_id` is also set when an account is signed in, so the thread follows the account.
- `presence_report_messages`: `kind` is `message`, `info_request` (with `choices`, rendered as a questionnaire), `status_change` (`body` = previous status, `status_to`) or `note`. `visibility` is `public` or `internal`.

## Rules

- Reporter routes are `/presence-reports*` and read the key from the `x-reporter-key` header (32 to 128 characters). A report that is not the caller's answers `404`, never `403`.
- Internal notes never leave `loadMessages(..., "reporter")`: the filter lives in the service, not in the routes. Keep the test that checks it.
- Anonymity: when `anonymous` is true the team sees `Anonyme` (`reporterLabelOf`). Staff views never carry `secret_hash`, `reporter_id`, `device_id` or the key. Team members are always shown with name, avatar and role.
- Staff routes are `/admin/presence-reports*` (`review`, delete needs `manage`). A staff message can carry `statusTo`: message, status marker and audit entry happen in one locked transaction. Sending `choices` moves the thread to `info_requested`.
- A reporter answer moves `info_requested` and `fixed` back to `in_progress`. `closed` rejects writes; the reporter can reopen within 14 days of resolution.
- `info_requested` gets `auto_close_at` (14 days). `closeStaleReports` closes overdue threads, run by `POST /presence-reports/close-stale` (`Authorization: Bearer CREATOR_WEBHOOK_SECRET`, same secret and scheduler as the PR job). Call it at least daily.
- Limits: 5 open threads per key, 5 writes per 10 minutes, 60 messages per thread, 2000 characters. Attachments: up to 2 PNG or JPEG data URLs per message (4 MiB each), checked by magic number and `sharp` metadata, resized to 1600 px max and re-encoded (`report-attachments.ts`), stored on R2 at `reports/<uuid>/<n>.<ext>` and exposed as public URLs. A reporter upload only happens after the ownership check; failed requests delete what they uploaded; deleting a thread deletes its files. Message routes accept up to 12 MiB (`default-body-limit.ts`). Without R2 the answer is `503 STORAGE_UNAVAILABLE`. Account deletion does not erase threads yet.
