# Sync

Per-account copy of the extension's synced documents; local extension storage stays the source of truth. Every route uses `requireExtensionToken("sync")`.

- Keys, size limits and schemas live in `@nowly/shared` (`SYNC_DOCUMENT_KEYS`, `SYNC_DOCUMENT_MAX_BYTES`, `syncDocumentSchemas`). A new key needs only those: export and erasure already cover every row. Unknown fields are stripped, so device-only settings never reach the database.
- Never sync live browsing state (current activity, tabs, history).
- Concurrency relies on `updateMany` with `version: baseVersion` and on the primary key for the first write (`P2002` becomes `409 VERSION_CONFLICT`). Keep both.
- `DELETE /sync` erases the server copy and revokes every extension token of the account.
