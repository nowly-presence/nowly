# Status

Service health: `GET /status` (read the stored report), `GET /status/check` and `POST /status/check` (run a check, both behind `requireCronAuth`, fail-closed like `auth`).

- Checks are triggered by an external scheduler. `GET /status` only reads stored samples; never make it run a check. `checkIntervalHours` is metadata for clients, not a scheduler.
- With `DATABASE_URL`, samples persist in PostgreSQL; otherwise they live in an in-memory `Map` that resets on restart.
- URLs use `NEXT_PUBLIC_API_BASE_URL` (default `https://api.nowly.me`). The `library` check hits `/presences`; if it slows down, inspect `getPresenceListData`.
- `classifyResponse`: operational ≤750ms, slow ≤2000ms, degraded above, down on non-2xx/timeout. Change thresholds there only.

## Adding a service

Add it to `services` and the `StatusServiceId` union in `status.service.ts`, then to `apps/web/features/status/lib/status.ts` (type and `getFallbackStatusReport()`).
