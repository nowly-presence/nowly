# Presence

Presence registry: metadata, stats, signed releases, published versions, activity reports, likes.

- `GET /presences`: list with aggregated stats (`getPresenceListData`). `GET /stats`: global stats.
- `GET /:slug`, `/:slug/stats`, versions routes: single-slug reads (`getPresenceMeta`/`getPresenceStats`). Archived presences answer `404 PRESENCE_NOT_FOUND` unless the request has admin bearer access (`hasAdminAuth`).
- Signed release (`buildRelease`, `presence.service.ts`): bundle hash, metadata hash and a signature over the canonical payload. Do not change canonical JSON or payload fields without coordinating with the extension verifier.
- `POST /:slug/report`: user issue report. `POST /active` and `DELETE /active/:deviceId/:slug?`: device activity heartbeat and removal.
- Publishing (`PUT /:slug`, `POST /sync`, both `requireAuth`) writes through `addVersion`/`setVersion`; `addedAt`/`updatedAt` come from the release, not from "now".
- `metadata.aliases` are alternative library URL slugs resolved only by the website (`/library/<alias>` redirects to the slug); API routes keep using the canonical slug. `POST /sync` answers `400 PRESENCE_ALIAS_CONFLICT` before any write when an alias is malformed or already a slug/alias of another non-archived presence (`getPresenceAliasIssues`, `@nowly/shared`).

## Bulk vs single

`getPresenceListData` must stay a fixed number of bulk queries (`findMany` + `groupBy`). Never query per slug inside it: that N+1 made the library status check "Degraded". Add a list stat as another bulk query merged by slug and add the field to `PresenceListItem`. Single-slug endpoints are deliberately a separate code path.

If the `library` status check slows down, inspect `getPresenceListData` first.

Consumed by the extension (reports) and the website (library pages).
