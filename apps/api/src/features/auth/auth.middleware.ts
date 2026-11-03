import { serverEnv } from "@nowly/env/server";
import type { Context, MiddlewareHandler } from "hono";

const isProduction = (): boolean => process.env.NODE_ENV === "production";

const adminSecret = (): string | undefined => serverEnv.API_SECRET_KEY ?? process.env.API_SECRET_KEY;

export const hasAdminAuth = (c: Context): boolean => {
  const secret = adminSecret();

  if (!secret) return false;

  return c.req.header("authorization") === `Bearer ${secret}`;
};

export const requireSecret =
  (secretOf: () => string | undefined, missingError: string): MiddlewareHandler =>
  async (c, next) => {
    const secret = secretOf();

    if (!secret && isProduction()) return c.json({ error: missingError }, 500);

    if (secret && c.req.header("authorization") !== `Bearer ${secret}`) return c.json({ error: "UNAUTHORIZED" }, 401);

    await next();
  };

export const requireAuth = requireSecret(adminSecret, "API_SECRET_MISSING");