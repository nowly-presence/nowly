# Status

Health checks for Nowly's services: `GET /status` (last known report), `GET /status/check` + `POST /status/check` (trigger/read an on-demand check, cron-guarded).

## Add a new monitored service

1. Add `{ id: "your-id", url: "https://..." }` to the `services` array in `status.service.ts` (around line 45).
2. Add `"your-id"` to the `StatusServiceId` union at the top of the same file.
3. Update `apps/web`'s `features/status/lib/status.ts` — add the id to its own `StatusServiceId` type and to `getFallbackStatusReport()`'s `emptyServices` (see that feature's `AGENTS.md`).
4. That's it — `getStatusReport()`/`runStatusCheck()` iterate over `services` generically, no other branch to add.

## Change how a status is classified (thresholds)

Edit `classifyResponse()`: `operational` ≤750ms, `slow` ≤2000ms, `degraded` above that, `down` on non-2xx/timeout/no response. Change the thresholds here, not per-caller.

## Gotchas
- Samples are kept in an in-memory `Map` (`sampleStore`), not persisted to a database — a restart or a second API instance behind a load balancer resets/fragments history. If status history looks inconsistent across requests, this is why; don't assume there's a DB-backed bug to chase.
- The `"library"` service checks `${API_BASE_URL}/presences` — i.e. the `presence` feature's `GET /` (see that feature's `AGENTS.md`). If this check gets slow, the bug is almost always inside `getPresenceListData` (`presence.repository.ts`), not in this file — that's exactly what caused the "Bibliothèque de présences: 2067ms Dégradé" incident this status page was built to catch.
- `runStatusCheck` is meant to be called on a schedule (cron) via the guarded `POST /status/check`, not on every `GET /status` — don't make `GET /status` trigger a fresh check itself, it should only read `sampleStore`.

## Notable dependencies
`presence` feature (one of the status sources), `auth` feature (shared fail-closed guard pattern used by the cron endpoint).
