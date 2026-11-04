import type { AppEnv } from "@/context";
import { accountOf } from "@/features/account/extension-token.middleware";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { USER_ROLES } from "@nowly/shared/roles";
import { Hono } from "hono";
import { z } from "zod";
import { requireCapability } from "./admin.middleware";
import { listAdminActions } from "./audit.service";
import { deletePresenceCompletely, listHiddenPresences, setPresenceHidden } from "./presence-moderation.service";
import { listStaffUsers, searchAdminUsers, setUserRole, setUserVerified } from "./roles.service";

const ADMIN_RATE_LIMIT = rateLimit({
  name: "admin",
  max: 30,
  windowMs: MINUTE_MS
});
const RoleBodySchema = z.strictObject({ role: z.enum(USER_ROLES) });
const VerifiedBodySchema = z.strictObject({ verified: z.boolean() });
const UserSearchSchema = z.strictObject({ q: z.string().trim().min(2).max(64) });
const HiddenBodySchema = z.strictObject({ hidden: z.boolean() });
const SlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(96)
  .regex(/^[a-z0-9][a-z0-9-]*$/);
const AuditQuerySchema = z.strictObject({ before: z.iso.datetime({ offset: true }).optional() });

export const adminRoutes = new Hono<AppEnv>()
  .use(ADMIN_RATE_LIMIT)
  .get("/audit", requireCapability("manage"), async (c) => {
    const query = AuditQuerySchema.safeParse(c.req.query());

    if (!query.success) return c.json({ error: "INVALID_QUERY" }, 400);

    c.header("Cache-Control", "no-store");
    return c.json({ events: await listAdminActions(query.data.before ? new Date(query.data.before) : undefined) });
  })
  .get("/users/staff", requireCapability("manage"), async (c) => {
    c.header("Cache-Control", "no-store");
    return c.json({ users: await listStaffUsers() });
  })
  .get("/users", requireCapability("manage"), async (c) => {
    const query = UserSearchSchema.safeParse(c.req.query());

    if (!query.success) return c.json({ error: "INVALID_QUERY" }, 400);

    c.header("Cache-Control", "no-store");
    return c.json({ users: await searchAdminUsers(query.data.q) });
  })
  .put("/users/:userId/verified", requireCapability("manage"), async (c) => {
    const body = VerifiedBodySchema.safeParse(await jsonBody(c));

    if (!body.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const result = await setUserVerified(
      {
        kind: "user",
        userId: accountOf(c).userId
      },
      c.req.param("userId"),
      body.data.verified
    );

    if (!result.found) return c.json({ error: "USER_NOT_FOUND" }, 404);

    return c.json({
      verified: body.data.verified,
      changed: result.changed
    });
  })
  .get("/presences/hidden", requireCapability("publish"), async (c) => {
    c.header("Cache-Control", "no-store");
    return c.json({ presences: await listHiddenPresences() });
  })
  .put("/presences/:slug/hidden", requireCapability("publish"), async (c) => {
    const slug = SlugSchema.safeParse(c.req.param("slug"));
    const body = HiddenBodySchema.safeParse(await jsonBody(c));

    if (!slug.success || !body.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const result = await setPresenceHidden(
      {
        kind: "user",
        userId: accountOf(c).userId
      },
      slug.data,
      body.data.hidden
    );

    if (!result.found) return c.json({ error: "PRESENCE_NOT_FOUND" }, 404);

    return c.json({
      hidden: body.data.hidden,
      changed: result.changed
    });
  })
  .delete("/presences/:slug", requireCapability("publish"), async (c) => {
    const slug = SlugSchema.safeParse(c.req.param("slug"));

    if (!slug.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const result = await deletePresenceCompletely(
      {
        kind: "user",
        userId: accountOf(c).userId
      },
      slug.data
    );

    if (!result.found) return c.json({ error: "PRESENCE_NOT_FOUND" }, 404);

    return c.json({
      deleted: true,
      repository: result.repository
    });
  })
  .put("/users/:userId/role", requireCapability("manage"), async (c) => {
    const body = RoleBodySchema.safeParse(await jsonBody(c));

    if (!body.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const targetId = c.req.param("userId");
    const { userId } = accountOf(c);

    if (targetId === userId) return c.json({ error: "CANNOT_CHANGE_OWN_ROLE" }, 409);

    const result = await setUserRole(
      {
        kind: "user",
        userId
      },
      targetId,
      body.data.role
    );

    if (!result.found) return c.json({ error: "USER_NOT_FOUND" }, 404);

    return c.json({
      role: result.role,
      changed: result.changed,
      revokedTokens: result.revokedTokens
    });
  });