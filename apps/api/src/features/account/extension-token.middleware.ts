import { hasDatabase } from "@/db/client";
import type { AppEnv } from "@/context";
import { getAuth } from "@/features/auth/better-auth";
import type { ExtensionTokenScope } from "@nowly/shared";
import type { Context, MiddlewareHandler } from "hono";
import { findActiveExtensionToken, touchExtensionToken } from "./extension-token.service";

export type AccountContext = {
  userId: string;
  deviceId: string | null;
  scopes: ExtensionTokenScope[];
  tokenId: string | null;
};

const BEARER_PREFIX = "Bearer ";

const bearerToken = (c: Context): string | null => {
  const header = c.req.header("authorization");

  if (!header?.startsWith(BEARER_PREFIX)) return null;

  const token = header.slice(BEARER_PREFIX.length).trim();
  return token || null;
};

const resolveTokenAccount = async (c: Context): Promise<AccountContext | null> => {
  const token = bearerToken(c);

  if (!token) return null;

  const record = await findActiveExtensionToken(token);

  if (!record) return null;

  await touchExtensionToken(record).catch(() => undefined);
  return {
    userId: record.userId,
    deviceId: record.deviceId,
    scopes: record.scopes,
    tokenId: record.id
  };
};

export const getSessionUserId = async (c: Context): Promise<string | null> => {
  try {
    const session = await getAuth().api.getSession({ headers: c.req.raw.headers });
    return session?.user.id ?? null;
  } catch {
    return null;
  }
};

const databaseUnavailable = (c: Context) => c.json({ error: "DATABASE_UNAVAILABLE" }, 503);

const unauthorized = (c: Context) => c.json({ error: "UNAUTHORIZED" }, 401);

export const requireExtensionToken =
  (scope: ExtensionTokenScope): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    if (!hasDatabase()) return databaseUnavailable(c);

    const account = await resolveTokenAccount(c);

    if (!account || !account.scopes.includes(scope)) return unauthorized(c);

    c.set("account", account);
    await next();
  };

const sessionAccount = async (c: Context): Promise<AccountContext | null> => {
  const userId = await getSessionUserId(c);
  return userId ? { userId, deviceId: null, scopes: [], tokenId: null } : null;
};

export const requireSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!hasDatabase()) return databaseUnavailable(c);

  const account = await sessionAccount(c);

  if (!account) return unauthorized(c);

  c.set("account", account);
  await next();
};

export const resolveAccount = async (c: Context): Promise<AccountContext | null> =>
  (bearerToken(c) ? await resolveTokenAccount(c) : null) ?? (await sessionAccount(c));

export const requireTokenOrSession: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!hasDatabase()) return databaseUnavailable(c);

  const account = await resolveAccount(c);

  if (!account) return unauthorized(c);

  c.set("account", account);
  await next();
};

export const accountOf = (c: Context<AppEnv>): AccountContext => c.get("account");