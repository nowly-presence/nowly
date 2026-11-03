import type { AppEnv } from "@/context";
import { hasDatabase } from "@/db/client";
import { accountOf, requireExtensionToken } from "@/features/account/extension-token.middleware";
import { limitBody } from "@/middleware/body-limit";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { PUBLICATION_MAX_BYTES, publicationIdSchema, publicationWriteSchema, publicationReserveSchema } from "@nowly/shared/activity-publication";
import { Hono } from "hono";
import { z } from "zod";
import { ownedPublication, readPublication, reservePublication, unpublishActivity, writePublication } from "./activity-sharing.service";

const PUBLISHER_RATE_LIMIT = rateLimit({
  name: "activity-publisher",
  max: 10,
  windowMs: MINUTE_MS
});
const READ_RATE_LIMIT = rateLimit({
  name: "activity-read",
  max: 60,
  windowMs: MINUTE_MS
});
const localKeySchema = z.string().uuid();
const unpublishSchema = z.object({ baseRevision: z.number().int().nonnegative() }).strict();

export const activitySharingRoutes = new Hono<AppEnv>()
  .post("/me/activity-publications/:key", PUBLISHER_RATE_LIMIT, requireExtensionToken("creator"), limitBody(PUBLICATION_MAX_BYTES), async (c) => {
    const body = publicationReserveSchema.safeParse(await jsonBody(c));
    const key = localKeySchema.safeParse(c.req.param("key"));

    if (!body.success || !key.success) return c.json({ error: "INVALID_REQUEST" }, 400);

    return c.json(await reservePublication(accountOf(c).userId, key.data, body.data.activity));
  })
  .get("/me/activity-publications/:key", requireExtensionToken("creator"), async (c) => {
    c.header("Cache-Control", "no-store");
    const key = localKeySchema.safeParse(c.req.param("key"));

    if (!key.success) return c.json({ error: "INVALID_REQUEST" }, 400);

    return c.json({ publication: await ownedPublication(accountOf(c).userId, key.data) });
  })
  .get("/activity-publications/:id", READ_RATE_LIMIT, async (c) => {
    c.header("Cache-Control", "no-store");

    if (!hasDatabase()) return c.json({ error: "DATABASE_UNAVAILABLE" }, 503);

    const id = publicationIdSchema.safeParse(c.req.param("id"));

    if (!id.success) return c.json({ error: "NOT_FOUND" }, 404);

    return c.json(await readPublication(id.data));
  })
  .put("/me/activity-publications/:key", PUBLISHER_RATE_LIMIT, requireExtensionToken("creator"), limitBody(PUBLICATION_MAX_BYTES), async (c) => {
    const body = publicationWriteSchema.safeParse(await jsonBody(c));
    const key = localKeySchema.safeParse(c.req.param("key"));

    if (!body.success || !key.success) return c.json({ error: "INVALID_REQUEST" }, 400);

    return c.json(await writePublication(accountOf(c).userId, key.data, body.data.activity, body.data.baseRevision, body.data.id));
  })
  .delete("/me/activity-publications/:id", PUBLISHER_RATE_LIMIT, requireExtensionToken("creator"), async (c) => {
    const body = unpublishSchema.safeParse(await jsonBody(c));
    const id = publicationIdSchema.safeParse(c.req.param("id"));

    if (!body.success || !id.success) return c.json({ error: "INVALID_REQUEST" }, 400);

    return c.json(await unpublishActivity(accountOf(c).userId, id.data, body.data.baseRevision));
  });