import type { AppEnv } from "@/context";
import { accountOf, requireExtensionToken } from "@/features/account/extension-token.middleware";
import { attachTokenToDevice } from "@/features/account/extension-token.service";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { deviceRateLimitKey } from "@/shared/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { deviceSyncBodySchema } from "@nowly/shared/schemas";
import { Hono } from "hono";
import { deriveDeviceToken, hasDeviceAccess, invalidDeviceToken } from "./device-token";
import { deleteDeviceData, exportDeviceData, linkDeviceToUser, syncDevice } from "./device.service";

const SYNC_RATE_LIMIT = rateLimit({
  name: "device-sync",
  max: 20,
  windowMs: MINUTE_MS,
  key: deviceRateLimitKey
});

export const deviceRoutes = new Hono<AppEnv>()
  .post("/sync", SYNC_RATE_LIMIT, async (c) => {
    const parsed = deviceSyncBodySchema.safeParse(await jsonBody(c));

    if (!parsed.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    await syncDevice(parsed.data);
    return c.json({
      ok: true,
      deviceToken: deriveDeviceToken(parsed.data.deviceId)
    });
  })
  .get("/:deviceId/export", async (c) => {
    const deviceId = c.req.param("deviceId").trim();

    if (!hasDeviceAccess(c, deviceId)) return invalidDeviceToken(c);

    const data = await exportDeviceData(deviceId);

    if (!data) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);

    return c.json(data);
  })
  .delete("/:deviceId", async (c) => {
    const deviceId = c.req.param("deviceId").trim();

    if (!hasDeviceAccess(c, deviceId)) return invalidDeviceToken(c);

    await deleteDeviceData(deviceId);
    return c.json({ ok: true });
  })
  .post("/:deviceId/link", requireExtensionToken("sync"), async (c) => {
    const deviceId = c.req.param("deviceId").trim();

    if (!hasDeviceAccess(c, deviceId)) return invalidDeviceToken(c);

    const account = accountOf(c);

    if (account.deviceId && account.deviceId !== deviceId) return c.json({ error: "DEVICE_MISMATCH" }, 403);

    await linkDeviceToUser(deviceId, account.userId);
    if (account.tokenId && !account.deviceId) await attachTokenToDevice(account.tokenId, deviceId);
    return c.json({ ok: true });
  });