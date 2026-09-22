# Status

Rendered by `app/[locale]/status`: `status-view.tsx` (current status), `status-history.tsx` (history).

## Add a new monitored service

The service list is defined on the API side, this feature only renders what it's given:

1. Add the new service to `apps/api/src/features/status/status.service.ts` (see that feature's `AGENTS.md`) — it must show up in the API's `GET /status` response.
2. In `apps/web/features/status/lib/status.ts`, add the new id to `StatusServiceId` (a union of `"website" | "api" | "library" | "cdn"`) and to `emptyServices` in `getFallbackStatusReport()` (so the UI has something to render before the first successful fetch).
3. `status-view.tsx`/`status-history.tsx` iterate over `report.services`, so a correctly-typed new entry renders automatically — no per-service UI branch to add unless the new service needs a distinct icon (check the `Ri*Line` icon import at the top of `status-view.tsx`).

## Gotchas

- If a service check becomes slow, look at how many DB queries it triggers on the API side before suspecting the frontend — the "presence library" check used to be slow purely because of an N+1 query in `apps/api`'s `presence.repository.ts` (fixed; see that feature's `AGENTS.md`).
- `fetchStatusReport` has a 10s timeout and silently falls back to `getFallbackStatusReport()` (all services `"unknown"`) on any error — a service showing "unknown" on the page usually means the API call itself failed, not that the service crashed.

## Notable dependencies
`lib/presence-api.ts` (root, `presenceApiBaseUrl`). `status` feature of `apps/api`.
