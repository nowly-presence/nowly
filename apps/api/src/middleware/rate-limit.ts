import type { Context, MiddlewareHandler } from "hono";
import { clientIp } from "@/middleware/client-ip";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;

type RateLimitOptions = {
  max: number;
  windowMs: number;
  name: string;
  key?: (c: Context) => string | Promise<string>;
};

type Window = {
  count: number;
  resetAt: number;
};

const windows = new Map<string, Window>();
const SWEEP_EVERY = 1_000;
let calls = 0;

const sweep = (now: number): void => {
  calls += 1;

  if (calls % SWEEP_EVERY !== 0) return;

  for (const [key, window] of windows) if (window.resetAt <= now) windows.delete(key);
};

export const resetRateLimits = (): void => {
  windows.clear();
};

export const rateLimit =
  ({ max, windowMs, name, key = clientIp }: RateLimitOptions): MiddlewareHandler =>
  async (c, next) => {
    const now = Date.now();
    sweep(now);

    const bucket = `${name}:${await key(c)}`;
    const current = windows.get(bucket);
    const window = current && current.resetAt > now ? current : { count: 0, resetAt: now + windowMs };
    window.count += 1;
    windows.set(bucket, window);

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - window.count)));

    if (window.count > max) {
      c.header("Retry-After", String(Math.ceil((window.resetAt - now) / 1000)));
      return c.json({ error: "RATE_LIMITED" }, 429);
    }

    await next();
  };