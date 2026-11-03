import type { AppEnv } from "@/context";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { extensionTokenBodySchema } from "@nowly/shared/schemas";
import { isStaffRole } from "@nowly/shared/roles";
import { Hono } from "hono";
import { ACCOUNT_PROVIDERS, deleteAccountData, exportAccountData, getAccountProfile, listAccountCustomActivities, listAccountDevices, listAccountPresences, unlinkAccountDevice, unlinkAllAccountDevices } from "./account.service";
import { accountOf, requireExtensionToken, requireSession, requireTokenOrSession } from "./extension-token.middleware";
import { createExtensionToken, revokeExtensionToken } from "./extension-token.service";

const TOKEN_RATE_LIMIT = rateLimit({
  name: "extension-tokens",
  max: 10,
  windowMs: MINUTE_MS
});

export const accountRoutes = new Hono<AppEnv>()
  .post("/extension/tokens", TOKEN_RATE_LIMIT, requireSession, async (c) => {
    const parsed = extensionTokenBodySchema.safeParse((await jsonBody(c)) ?? {});

    if (!parsed.success) return c.json({ error: "INVALID_REQUEST_BODY" }, 400);

    const { userId } = accountOf(c);
    const user = await getAccountProfile(userId);

    if (!user) return c.json({ error: "UNAUTHORIZED" }, 401);
    if (parsed.data.scopes.includes("admin") && !isStaffRole(user.role)) return c.json({ error: "ADMIN_REQUIRED" }, 403);

    const { token, expiresAt } = await createExtensionToken({
      userId,
      deviceId: parsed.data.deviceId,
      scopes: parsed.data.scopes
    });
    return c.json({
      token,
      scopes: parsed.data.scopes,
      user,
      providers: [...ACCOUNT_PROVIDERS],
      expiresAt: expiresAt.getTime()
    });
  })
  .delete("/extension/tokens/current", requireExtensionToken("sync"), async (c) => {
    const { tokenId } = accountOf(c);
    if (tokenId) await revokeExtensionToken(tokenId);
    return c.json({ ok: true });
  })
  .get("/me", requireTokenOrSession, async (c) => {
    const user = await getAccountProfile(accountOf(c).userId);

    if (!user) return c.json({ error: "UNAUTHORIZED" }, 401);

    return c.json(user);
  })
  .get("/me/devices", requireTokenOrSession, async (c) => {
    const { userId, deviceId } = accountOf(c);
    return c.json({ devices: await listAccountDevices(userId, deviceId) });
  })
  .get("/me/presences", requireSession, async (c) => c.json({ presences: await listAccountPresences(accountOf(c).userId) }))
  .get("/me/custom-activities", requireSession, async (c) => c.json({ activities: await listAccountCustomActivities(accountOf(c).userId) }))
  .delete("/me/devices", requireSession, async (c) => {
    const keep = c.req.query("keep")?.trim() || null;
    return c.json({ unlinked: await unlinkAllAccountDevices(accountOf(c).userId, keep) });
  })
  .delete("/me/devices/:deviceId", requireSession, async (c) => {
    const unlinked = await unlinkAccountDevice(accountOf(c).userId, c.req.param("deviceId").trim());

    if (!unlinked) return c.json({ error: "DEVICE_NOT_FOUND" }, 404);

    return c.json({ ok: true });
  })
  .get("/me/export", requireSession, async (c) => {
    const data = await exportAccountData(accountOf(c).userId);

    if (!data) return c.json({ error: "ACCOUNT_NOT_FOUND" }, 404);

    return c.json(data);
  })
  .delete("/me", requireSession, async (c) => {
    await deleteAccountData(accountOf(c).userId);
    return c.json({ ok: true });
  });