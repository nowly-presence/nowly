# Device

Device (browser extension) pairing: `POST /sync` (register/refresh, rate-limited 20/min), `GET /:deviceId/export` and `DELETE /:deviceId` (GDPR right of access / erasure), `POST /:deviceId/link` (attach the device to a Nowly account).

## Add data linked to a device

Whenever you add a new table/field keyed by `deviceId` anywhere in the API, update both:

1. `exportDeviceData` in `device.service.ts`: it must include the new data so the GDPR export stays complete.
2. `deleteDeviceData` in the same file: it must delete it too, or erasure requests leave orphaned rows behind.

Treat this as a checklist item for *any* new device-linked feature (e.g. a new presence-usage table), not just changes made directly inside this folder.

## Add a new device-scoped endpoint

1. Use `requireDeviceAccess(request, reply, deviceId)` from `device-token.ts` to gate it. It checks the `?token=` query param against `deriveDeviceToken(deviceId)`, the same check `export`/`DELETE` already use. Don't invent a second auth mechanism for device-scoped routes.
2. Trim `deviceId` from `request.params` before use (existing routes do `request.params.deviceId.trim()`).

## Account link

`POST /:deviceId/link` needs both `Authorization: Bearer <extension token>` (scope `sync`) and the device token. It sets `Device.userId`, records the device on the token, and moves the device's `PresenceLike` rows to the account, keeping the oldest like per presence. A token issued for another device gets `403 DEVICE_MISMATCH`. After that, `likePresence` / `hasLikedPresence` / `unlikePresence` (`features/presence/presence.repository.ts`) treat all devices of the account as one liker. Deleting the account sets `userId` back to `null` on devices and likes.

## Notable dependencies
`@nowly/shared/schemas` (`deviceSyncBodySchema`), `features/account` (extension token guard). Consumed by `apps/extension` for initial pairing.
