# Presence

The presence registry: metadata, usage stats, published versions, real-time activity reports.

- `GET /` — all presences with aggregated stats (`getPresenceListData` in `presence.repository.ts`).
- `GET /stats` — global stats.
- `GET /:slug`, `GET /:slug/stats` — one presence's metadata/stats (`getPresenceMeta`/`getPresenceStats` — separate single-slug functions, not reused by `GET /`).
- `POST /:slug/report` — a device reports current activity.
- `GET /:slug/versions`, `GET /:slug/versions/:version` — published version history.
- `DELETE /active/:deviceId/:slug?` — a device removes itself from the active registry.

## Add a new aggregated stat to `GET /` (the list endpoint)

1. Add a new bulk Prisma query to `getPresenceListData` in `presence.repository.ts` — e.g. `presence.findMany`/`someTable.groupBy`, scoped to all presences at once.
2. Merge the result into the per-presence object the function already builds by `slug`, the same way the existing `devicePresence.groupBy`/`presenceActiveDevice.groupBy`/`presenceLike.groupBy` results are merged.
3. **Do not** loop over presences and query per-slug inside `getPresenceListData` — that reintroduces the exact N+1 that made the "presence library" status check show up as "Degraded" (2000ms+) before this was fixed. If you need the same stat on the single-slug endpoints too, add it separately to `getPresenceStats`/`getPresenceMeta` — don't try to share one code path between the bulk and single-slug cases, they're deliberately separate.
4. Add the new field to `PresenceListItem` in `presence.types.ts`.

## Add a new field to a single-presence response (`GET /:slug`)

Edit `getPresenceMeta`/`getPresenceStats` in `presence.repository.ts` directly — these don't need the bulk-query discipline `getPresenceListData` does, since they only ever run for one slug at a time.

## Gotchas
- If the status check for this feature (surfaced in `apps/web`'s `status` feature) becomes slow again, check `getPresenceListData` for a query added inside a loop before suspecting anything else — that's exactly what happened last time.

## Notable dependencies
Prisma (`src/db/client.ts`). Consumed by the extension (activity reporting, `POST /:slug/report`) and the website (library page, `GET /` and `GET /:slug`).
