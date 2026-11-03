import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

const IPV4_MAPPED_PREFIX = "::ffff:";

const normalizeIp = (ip: string): string => (ip.startsWith(IPV4_MAPPED_PREFIX) ? ip.slice(IPV4_MAPPED_PREFIX.length) : ip);

const socketIp = (c: Context): string | undefined => {
  try {
    return getConnInfo(c).remote.address;
  } catch {
    return undefined;
  }
};

export const clientIp = (c: Context): string => {
  const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return normalizeIp(forwarded || c.req.header("x-real-ip") || socketIp(c) || "unknown");
};