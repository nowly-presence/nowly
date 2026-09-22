# Device

Device (browser extension) pairing: `POST /sync` (register/refresh, rate-limited 20/min), `GET /:deviceId/export` and `DELETE /:deviceId` (GDPR right of access / erasure).

## Add data linked to a device

Whenever you add a new table/field keyed by `deviceId` anywhere in the API, update both:

1. `exportDeviceData` in `device.service.ts` — must include the new data so the GDPR export stays complete.
2. `deleteDeviceData` in the same file — must delete it too, or erasure requests leave orphaned rows behind.

Treat this as a checklist item for *any* new device-linked feature (e.g. a new presence-usage table), not just changes made directly inside this folder.

## Add a new device-scoped endpoint

1. Use `requireDeviceAccess(request, reply, deviceId)` from `device-token.ts` to gate it — it checks the `?token=` query param against `deriveDeviceToken(deviceId)`, the same check `export`/`DELETE` already use. Don't invent a second auth mechanism for device-scoped routes.
2. Trim `deviceId` from `request.params` before use (existing routes do `request.params.deviceId.trim()`).

## Notable dependencies
`@nowly/shared/schemas` (`deviceSyncBodySchema`). Consumed by `apps/extension` for initial pairing.
