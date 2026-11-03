import { authTrustedOrigins } from "@/features/auth/better-auth";
import { cors } from "hono/cors";

const EXTENSION_SCHEMES = ["chrome-extension://", "moz-extension://"];

export const isAllowedOrigin = (origin: string | undefined): boolean =>
  !origin || authTrustedOrigins().includes(origin) || EXTENSION_SCHEMES.some((scheme) => origin.startsWith(scheme));

export const corsMiddleware = cors({
  origin: (origin) => (origin && isAllowedOrigin(origin) ? origin : null),
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-user-token", "x-device-token"],
  credentials: true
});