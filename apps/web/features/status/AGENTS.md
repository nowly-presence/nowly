# Status

`app/[locale]/status` renders `components/status-view.tsx` (current status) and `components/status-history.tsx` (history).

## Add a monitored service

The list is defined by the API; this feature renders what it receives.

1. Add the service in `apps/api/src/features/status/status.service.ts` so `GET /status` returns it.
2. In `lib/status.ts`, add its id to `StatusServiceId` (currently `"website" | "api" | "library" | "cdn"`) and to `emptyServices` (rendered when the fetch fails).
3. Both views iterate `report.services`. Add an icon to `serviceIconMap` in `status-view.tsx` (typed `Record<StatusServiceId, ...>`, so it won't compile without one).

## Gotchas

- `fetchStatusReport` calls `${presenceApiBaseUrl()}/status` with `cache: "no-store"` and a 10s `AbortSignal.timeout`. It does not check `res.ok`: any response that parses to JSON with a `services` array is used as-is, including an error body shaped that way. Network errors, timeouts, invalid JSON and bodies without `services` return `getFallbackStatusReport()` (all services `unknown`).
- A service stuck on "unknown" usually means the API call itself failed. If a check is slow, look at its DB queries on the API side before the frontend (the library check was once slow due to an N+1 in `apps/api`'s `presence.repository.ts`).

## Notable dependencies
`lib/presence-api.ts` (`presenceApiBaseUrl`, server-only), `status` feature of `apps/api`.
