import { hasAdminAuth, requireAuth } from "@/features/auth/auth.middleware";
import { hasDeviceAccess, invalidDeviceToken } from "@/features/device/device-token";
import { deviceExists } from "@/features/device/device.service";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { deviceRateLimitKey } from "@/shared/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { buildLocaleObject } from "@nowly/locales";
import { presenceActiveBodySchema, presenceLikeBodySchema, presenceLikeQuerySchema, presencePutBodySchema, presenceReportBodySchema } from "@nowly/shared/schemas";
import { Hono, type Context } from "hono";
import { addVersion, clearActiveDevice, clearActiveDevicesForDevice, getGlobalPresenceStats, getLikeCount, getPresenceListData, getPresenceMeta, getPresenceStats, getVersionHistory, hasLikedPresence, likePresence, markActiveDevice, setAdded, setUpdated, setVersion, unlikePresence } from "./presence.repository";
import { buildRelease } from "./presence.service";
import { presenceDisplayName, sanitizeReportMessage, submitPresenceReport } from "./presence-report";
import { PresenceAliasConflictError, processPresenceSync, type PresenceSyncBody } from "./presence.sync";

const STATS_CACHE = "public, max-age=5, stale-while-revalidate=10";
const REPORT_WINDOW_MS = 10 * MINUTE_MS;

const isHiddenArchive = async (slug: string, c: Context): Promise<boolean> => {
  const stats = await getPresenceStats(slug);
  return Boolean(stats?.archived) && !hasAdminAuth(c);
};

const presenceNotFound = (c: Context) => c.json({ error: "PRESENCE_NOT_FOUND" }, 404);

const slugOf = (c: Context): string => (c.req.param("slug") ?? "").toLowerCase();

export const presenceRoutes = new Hono()
  .get("/", async (c) => c.json(await getPresenceListData()))
  .get("/stats", async (c) => {
    c.header("Cache-Control", STATS_CACHE);
    return c.json(await getGlobalPresenceStats());
  })
  .post("/sync", requireAuth, async (c) => {
    try {
      const body = await jsonBody(c);

      const { results, archived } = await processPresenceSync(body as PresenceSyncBody);
      return c.json({
        ok: true,
        results,
        archived
      });
    } catch (error) {
      if (error instanceof PresenceAliasConflictError) return c.json(
        {
          error: "PRESENCE_ALIAS_CONFLICT",
          issues: error.issues
        },
        400
      );

      throw error;
    }
  })
  .post(
    "/active",
    rateLimit({
      name: "presence-active",
      max: 30,
      windowMs: MINUTE_MS,
      key: deviceRateLimitKey
    }),
    async (c) => {
      const parsed = presenceActiveBodySchema.safeParse(await jsonBody(c));

      if (!parsed.success || !parsed.data.deviceId) return c.json({ error: "DEVICE_ID_REQUIRED" }, 400);

      const { presences: slugs, deviceId } = parsed.data;

      if (!(await deviceExists(deviceId))) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);

      for (const slug of slugs) await markActiveDevice(slug.toLowerCase(), deviceId);

      return c.json({
        ok: true,
        count: slugs.length
      });
    }
  )
  .delete("/active/:deviceId/:slug?", async (c) => {
    const deviceId = c.req.param("deviceId").trim();
    const slug = c.req.param("slug")?.trim();

    if (!deviceId) return c.json({
      ok: false,
      error: "DEVICE_ID_REQUIRED"
    });

    if (slug) {
      await clearActiveDevice(slug, deviceId);
      return c.json({
        ok: true,
        removed: 1
      });
    }

    await clearActiveDevicesForDevice(deviceId);
    return c.json({
      ok: true,
      removed: null
    });
  })
  .get("/:slug/stats", async (c) => {
    const slug = slugOf(c);

    if (await isHiddenArchive(slug, c)) return presenceNotFound(c);

    c.header("Cache-Control", STATS_CACHE);
    return c.json(await getPresenceStats(slug));
  })
  .get("/:slug", async (c) => {
    const slug = slugOf(c);

    if (await isHiddenArchive(slug, c)) return presenceNotFound(c);

    const release = await buildRelease(slug);

    if (!release) return presenceNotFound(c);

    c.header("Cache-Control", "no-store");
    return c.json(release);
  })
  .post(
    "/:slug/report",
    rateLimit({
      name: "presence-report",
      max: 8,
      windowMs: REPORT_WINDOW_MS
    }),
    async (c) => {
      const slug = slugOf(c);

      if (await isHiddenArchive(slug, c)) return presenceNotFound(c);

      const parsed = presenceReportBodySchema.safeParse(await jsonBody(c));

      if (!parsed.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

      const meta = await getPresenceMeta(slug);

      if (!meta) return presenceNotFound(c);

      const message = sanitizeReportMessage(parsed.data.message);

      if (!message) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

      const result = await submitPresenceReport({
        slug,
        name: presenceDisplayName(meta, slug, parsed.data.locale),
        message,
        locale: parsed.data.locale,
        browser: parsed.data.browser,
        browserVersion: parsed.data.browserVersion
      });

      if (result === "unconfigured") return c.json({ error: "REPORTS_UNAVAILABLE" }, 503);
      if (result === "failed") return c.json({ error: "REPORT_SEND_FAILED" }, 502);

      return c.json({ ok: true });
    }
  )
  .get("/:slug/versions", async (c) => {
    const slug = slugOf(c);

    if (await isHiddenArchive(slug, c)) return presenceNotFound(c);

    return c.json(await getVersionHistory(slug));
  })
  .get("/:slug/versions/:version", async (c) => {
    const slug = slugOf(c);

    if (await isHiddenArchive(slug, c)) return presenceNotFound(c);

    const release = await buildRelease(slug, c.req.param("version"));

    if (!release) return c.json({ error: "VERSION_NOT_FOUND" }, 404);

    c.header("Cache-Control", "no-store");
    return c.json(release);
  })
  .put("/:slug", requireAuth, async (c) => {
    const slug = slugOf(c);
    const parsedBody = presencePutBodySchema.safeParse(await jsonBody(c));

    if (!parsedBody.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const body = parsedBody.data;

    if (body.version) {
      const publishedAt = new Date();
      await setVersion(slug, body.version, publishedAt);

      if (body.changelog || body.author) {
        await addVersion(slug, {
          version: body.version,
          changelog: body.changelog ? JSON.stringify(buildLocaleObject(body.changelog)) : "",
          author: body.author ?? "unknown",
          authorGithub: body.authorGithub,
          pr: body.pr,
          timestamp: publishedAt.getTime()
        });
      }
    }

    if (body.added) await setAdded(slug, body.added);
    if (body.updated) await setUpdated(slug, body.updated);

    return c.json({ ok: true });
  })
  .get("/:slug/like", async (c) => {
    const parsed = presenceLikeQuerySchema.safeParse(c.req.query());

    if (!parsed.success) return c.json({ error: "DEVICE_ID_REQUIRED" }, 400);

    const slug = slugOf(c);
    return c.json({
      liked: await hasLikedPresence(slug, parsed.data.deviceId),
      count: await getLikeCount(slug)
    });
  })
  .post("/:slug/like", async (c) => {
    const parsed = presenceLikeBodySchema.safeParse(await jsonBody(c));

    if (!parsed.success) return c.json({ error: "DEVICE_ID_REQUIRED" }, 400);
    if (!hasDeviceAccess(c, parsed.data.deviceId)) return invalidDeviceToken(c);

    const slug = slugOf(c);
    await likePresence(slug, parsed.data.deviceId);
    return c.json({
      ok: true,
      count: await getLikeCount(slug)
    });
  })
  .delete("/:slug/like", async (c) => {
    const parsed = presenceLikeQuerySchema.safeParse(c.req.query());

    if (!parsed.success) return c.json({ error: "DEVICE_ID_REQUIRED" }, 400);
    if (!hasDeviceAccess(c, parsed.data.deviceId)) return invalidDeviceToken(c);

    const slug = slugOf(c);
    await unlikePresence(slug, parsed.data.deviceId);
    return c.json({
      ok: true,
      count: await getLikeCount(slug)
    });
  });