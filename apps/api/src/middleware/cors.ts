import { authTrustedOrigins } from "@/features/auth/better-auth";
import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

const EXTENSION_SCHEMES = ["chrome-extension://", "moz-extension://"];

export const isAllowedOrigin = (origin: string | undefined): boolean =>
  !origin || authTrustedOrigins().includes(origin) || EXTENSION_SCHEMES.some((scheme) => origin.startsWith(scheme));

const PUBLIC_CORS_PATHS = new Set(["/images-proxy", "/image-proxy", "/i"]);
const PUBLIC_CORS_PREFIXES = ["/images-proxy/", "/image-proxy/"];

const isPublicCorsPath = (path: string): boolean => PUBLIC_CORS_PATHS.has(path) || PUBLIC_CORS_PREFIXES.some((prefix) => path.startsWith(prefix));

const restrictedCors = cors({
  origin: (origin) => (origin && isAllowedOrigin(origin) ? origin : null),
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-user-token", "x-device-token", "x-reporter-key"],
  credentials: true
});

export const corsMiddleware: MiddlewareHandler = async (c, next) => {
  if (isPublicCorsPath(c.req.path)) return next();

  return restrictedCors(c, next);
};