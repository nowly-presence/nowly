# Status

Renders what the API's `GET /status` returns.

- New service: add it in `apps/api/src/features/status/status.service.ts`, then to `StatusServiceId` and `emptyServices` (`lib/status.ts`) and an icon in `serviceIconMap` (`status-view.tsx`).
- `fetchStatusReport` does not check `res.ok`; failures fall back to all services `unknown`. A service stuck on `unknown` usually means the API call failed; a slow `library` check usually means `getPresenceListData` on the API.
