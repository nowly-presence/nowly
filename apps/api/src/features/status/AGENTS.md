# Status

- `GET /status` only reads stored samples; checks run from an external scheduler through `GET` or `POST /status/check` (`requireCronAuth`, fail-closed). Never make `GET /status` run a check.
- Without `DATABASE_URL` samples live in memory and reset on restart.
- Thresholds live only in `classifyResponse`.
- New service: add it to `services` and `StatusServiceId` in `status.service.ts`, then follow `apps/web/features/status/AGENTS.md`.
