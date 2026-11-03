import { serverEnv } from "@nowly/env/server";
import type { Context } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";

// Per-device capability token used to authorize destructive operations keyed
// on a deviceId (uninstall cleanup). The token is HMAC-derived from the
// deviceId and only travels on the /devices/sync response and uninstall links.
const tokenSecret = (): string => serverEnv.DEVICE_TOKEN_SECRET ?? serverEnv.JWT_SECRET;

export const deriveDeviceToken = (deviceId: string): string => createHmac("sha256", tokenSecret()).update(`device-token:v1:${deviceId}`).digest("base64url");

export const verifyDeviceToken = (deviceId: string, token: string | undefined | null): boolean => {
  if (!deviceId || !token) return false;

  const expected = Buffer.from(deriveDeviceToken(deviceId));
  const provided = Buffer.from(token);

  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
};

const DEVICE_AUTH_PREFIX = "Device ";

const extractToken = (c: Context): string | undefined => {
  const header = c.req.header("x-device-token")?.trim();

  if (header) return header;

  const auth = c.req.header("authorization");

  if (auth?.startsWith(DEVICE_AUTH_PREFIX)) return auth.slice(DEVICE_AUTH_PREFIX.length).trim();

  return c.req.query("token")?.trim() || undefined;
};

export const hasDeviceAccess = (c: Context, deviceId: string): boolean => verifyDeviceToken(deviceId, extractToken(c));

export const invalidDeviceToken = (c: Context) => c.json({ error: "INVALID_DEVICE_TOKEN" }, 401);