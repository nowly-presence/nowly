# Device

Mounted under `/devices`: `POST /sync` (register/refresh, 20/min), `GET /:deviceId/export`, `DELETE /:deviceId`, `POST /:deviceId/link`. `customAssetsRoutes` is mounted on the same prefix.

## Device credential

`requireDeviceAccess(request, reply, deviceId)` (`device-token.ts`) checks a token derived from the device id (HMAC keyed by `DEVICE_TOKEN_SECRET`, or `JWT_SECRET`). Accepted, in this order: `x-device-token` header, `Authorization: Device <token>`, `?token=` query. Reuse it for every device-scoped route; trim `request.params.deviceId` first.

## Data keyed by deviceId

A new table or field keyed by `deviceId` anywhere in the API must be handled in `exportDeviceData` and `deleteDeviceData` (`device.service.ts`). Do not assume the current export/erasure is complete: verify it when touching either.

## Account link

`POST /:deviceId/link` needs `Authorization: Bearer <extension token>` (scope `sync`) plus the device credential. It sets `Device.userId`, records the device on the token and moves `PresenceLike` rows to the account, keeping the oldest per presence. A token issued for another device gets `403 DEVICE_MISMATCH`. Afterwards likes treat all devices of the account as one liker. Account deletion sets `userId` back to `null` on devices and likes.
