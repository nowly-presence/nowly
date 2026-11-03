import { hasDeviceAccess, invalidDeviceToken } from "@/features/device/device-token";
import { limitBody } from "@/middleware/body-limit";
import { HOUR_MS, rateLimit } from "@/middleware/rate-limit";
import { serverEnv } from "@nowly/env/server";
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { CUSTOM_IMAGE_MAX_BYTES, checkUpload, cleanupExpiredCustomAssets, isCustomImageMime, putCustomAsset, removeCustomAsset, touchCustomAsset } from "./custom-assets.service";

const deviceKey = (c: Context): string => (c.req.param("deviceId") ?? "").trim();

const UPLOAD_RATE_LIMIT = rateLimit({
  name: "custom-assets",
  max: 20,
  windowMs: HOUR_MS,
  key: deviceKey
});

export const customAssetsRoutes = new Hono()
  .put("/:deviceId/custom-assets/:sha256", UPLOAD_RATE_LIMIT, limitBody(CUSTOM_IMAGE_MAX_BYTES), async (c) => {
    const deviceId = deviceKey(c);

    if (!hasDeviceAccess(c, deviceId)) return invalidDeviceToken(c);

    const sha256 = c.req.param("sha256").toLowerCase();
    const mime = (c.req.header("content-type") ?? "").split(";")[0]?.trim() ?? "";

    if (!isCustomImageMime(mime)) return c.json({ error: "UNSUPPORTED_IMAGE" }, 415);

    const bytes = new Uint8Array(await c.req.arrayBuffer());
    const check = checkUpload(bytes, mime, sha256);

    if (!check.ok) return c.json({ error: check.error }, check.status);

    const asset = await putCustomAsset(deviceId, sha256, mime, bytes);

    if (!asset) return c.json({ error: "DATABASE_UNAVAILABLE" }, 503);

    return c.json(asset);
  })
  .post("/:deviceId/custom-assets/:sha256/touch", async (c) => {
    const deviceId = deviceKey(c);

    if (!hasDeviceAccess(c, deviceId)) return invalidDeviceToken(c);

    const asset = await touchCustomAsset(deviceId, c.req.param("sha256").toLowerCase());

    if (!asset) return c.json({ error: "CUSTOM_ASSET_NOT_FOUND" }, 404);

    return c.json(asset);
  })
  .delete("/:deviceId/custom-assets/:sha256", async (c) => {
    const deviceId = deviceKey(c);

    if (!hasDeviceAccess(c, deviceId)) return invalidDeviceToken(c);

    await removeCustomAsset(deviceId, c.req.param("sha256").toLowerCase());
    return c.body(null, 204);
  });

const requireCleanupAuth: MiddlewareHandler = async (c, next) => {
  const secret = serverEnv.CUSTOM_ASSETS_CRON_SECRET;

  if (!secret || c.req.header("authorization") !== `Bearer ${secret}`) return c.json({ error: "UNAUTHORIZED" }, 401);

  await next();
};

export const customAssetsCronRoutes = new Hono().post("/custom-assets/cleanup", requireCleanupAuth, async (c) =>
  c.json({ removed: await cleanupExpiredCustomAssets() })
);