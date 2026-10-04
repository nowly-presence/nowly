# Sync

Per-account copy of the extension's synced documents. The extension's local storage stays the source of truth; the server keeps one row per `(userId, key)` in `SyncDocument`.

## Routes (all `requireExtensionToken("sync")`)

| Method | Route | Role |
|---|---|---|
| GET | `/sync` | `{ documents: [{ key, value, version, updatedAt }], serverTime }` |
| GET | `/sync/changes?since=<ISO>` | Same shape, documents with `updatedAt >= since`. The extension passes the previous `serverTime`. |
| PUT | `/sync/:key` | Body `{ value, baseVersion }`. `200 { version, updatedAt }` when `baseVersion` matches (`0` creates). Otherwise `409 { error: "VERSION_CONFLICT", value, version, updatedAt }` (`value: null, version: 0` when the row is gone); the extension merges and retries. |
| DELETE | `/sync` | "Stop syncing": erases the account's server copy and revokes every extension token of the account (`{ ok, deleted }`), so no other device uploads its copy again. The site session and the account itself stay. |

## Keys

`SYNC_DOCUMENT_KEYS` and `SYNC_DOCUMENT_MAX_BYTES` live in `@nowly/shared`, the zod schemas in `@nowly/shared/schemas` (`syncDocumentSchemas`). Unknown fields are stripped by zod, so device-only settings (`customApiBaseUrl`, `developerMode`, `presencePaused`) never reach the database even if a client sends them. Sizes are measured after parsing: `413 SYNC_VALUE_TOO_LARGE`. Invalid values: `400 INVALID_SYNC_VALUE`. Unknown keys: `404 UNKNOWN_SYNC_KEY`.

`customActivities` is accepted ahead of extension 2.4.0 (items only, no active activity) so that release needs no migration.

## Add a synced key

1. Add it to `SYNC_DOCUMENT_KEYS` and `SYNC_DOCUMENT_MAX_BYTES` (`packages/shared/src/sync.ts`) and its schema to `syncDocumentSchemas`.
2. Nothing else on the server: export and erasure already cover every `SyncDocument` row.

## Gotchas

- Never store activity, tabs, URLs or history here. It is a product promise, not just a schema detail.
- Optimistic concurrency relies on `updateMany` with `version: baseVersion` and on the primary key for the first write (`P2002` becomes a `409`). Keep both.

## Notable dependencies
`features/account` (guard, `accountOf`), `@nowly/shared`.
