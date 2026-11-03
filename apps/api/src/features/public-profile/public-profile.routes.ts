import type { AppEnv } from "@/context";
import { accountOf, requireSession } from "@/features/account/extension-token.middleware";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { PUBLIC_HANDLE_PATTERN } from "@nowly/shared";
import { publicProfileBodySchema } from "@nowly/shared/schemas";
import { Hono } from "hono";
import { getPublicProfile, getPublicProfileSettings, HandleTakenError, savePublicProfileSettings } from "./public-profile.service";

const SAVE_RATE_LIMIT = rateLimit({
  name: "public-profile",
  max: 20,
  windowMs: MINUTE_MS,
  key: (c) => accountOf(c).userId
});
const PUBLIC_CACHE = "public, max-age=60, stale-while-revalidate=300";

export const publicProfileRoutes = new Hono<AppEnv>()
  .get("/me/public-profile", requireSession, async (c) => {
    c.header("Cache-Control", "no-store");
    return c.json(await getPublicProfileSettings(accountOf(c).userId));
  })
  .put("/me/public-profile", requireSession, SAVE_RATE_LIMIT, async (c) => {
    const body = publicProfileBodySchema.safeParse(await jsonBody(c));

    if (!body.success) return c.json({ error: "INVALID_PUBLIC_PROFILE" }, 400);

    try {
      return c.json(await savePublicProfileSettings(accountOf(c).userId, body.data));
    } catch (error) {
      if (error instanceof HandleTakenError) return c.json({ error: "HANDLE_TAKEN" }, 409);

      throw error;
    }
  })
  .get("/users/:handle", async (c) => {
    const handle = c.req.param("handle").toLowerCase();

    if (!PUBLIC_HANDLE_PATTERN.test(handle)) return c.json({ error: "PROFILE_NOT_FOUND" }, 404);

    const profile = await getPublicProfile(handle);

    if (!profile) return c.json({ error: "PROFILE_NOT_FOUND" }, 404);

    c.header("Cache-Control", PUBLIC_CACHE);
    return c.json(profile);
  });