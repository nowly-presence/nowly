import { limitBody } from "@/middleware/body-limit";
import type { MiddlewareHandler } from "hono";

export const DEFAULT_BODY_LIMIT = 1024 * 1024;

const LARGER_BODY_PREFIXES = ["/me/activity-publications/"];

const defaultLimit = limitBody(DEFAULT_BODY_LIMIT);

export const defaultBodyLimit: MiddlewareHandler = async (c, next) => {
  if (LARGER_BODY_PREFIXES.some((prefix) => c.req.path.startsWith(prefix))) return next();

  return defaultLimit(c, next);
};