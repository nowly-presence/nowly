# Sync

Per-account copy of the extension's synced documents (one `SyncDocument` row per `(userId, key)`). Local extension storage stays the source of truth. All routes use `requireExtensionToken("sync")`.

- `GET /sync` and `GET /sync/changes?since=<ISO>`: `{ documents: [{ key, value, version, updatedAt }], serverTime }`.
- `PUT /sync/:key`: body `{ value, baseVersion }`. `200 { version, updatedAt }` on match (`0` creates); otherwise `409 VERSION_CONFLICT` with the current value/version (`null`/`0` if gone). The extension merges and retries.
- `DELETE /sync`: erases the server copy and revokes every extension token of the account; the site session and account stay.

## Rules

- Keys, size limits and zod schemas live in `@nowly/shared` (`SYNC_DOCUMENT_KEYS`, `SYNC_DOCUMENT_MAX_BYTES`, `syncDocumentSchemas`). Unknown fields are stripped, so device-only settings never reach the database. Errors: `413 SYNC_VALUE_TOO_LARGE`, `400 INVALID_SYNC_VALUE`, `404 UNKNOWN_SYNC_KEY`.
- Adding a key: shared constants, size and schema only; export and erasure already cover every row.
- Never sync live browsing state (current activity, tabs, history). Saved custom activity configuration may contain user-authored URLs.
- Concurrency relies on `updateMany` with `version: baseVersion` and on the primary key for the first write (`P2002` becomes `409`). Keep both.
