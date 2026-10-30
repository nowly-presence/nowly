# Device

- Every device-scoped route calls `requireDeviceAccess(request, reply, deviceId)` (`device-token.ts`) after trimming `request.params.deviceId`.
- Any new table or field keyed by `deviceId`, anywhere in the API, must be handled in `exportDeviceData` and `deleteDeviceData` (`device.service.ts`). Verify their coverage when touching either.
- `POST /:deviceId/link` requires a `sync` extension token and the device credential; a token issued for another device gets `403 DEVICE_MISMATCH`. Account deletion resets `userId` to `null` on devices and likes.
