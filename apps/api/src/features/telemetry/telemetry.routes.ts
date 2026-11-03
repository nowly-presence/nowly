import { ingestSchema, umamiPayload, type ProductEvent } from "@nowly/telemetry";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";

const RESPONSE_BODY_LOG_LIMIT = 500;

class TelemetryRelayError extends Error {
  constructor(
    message: string,
    readonly diagnostic: Record<string, string | number>
  ) {
    super(message);
  }
}

export const createRelay = (fetcher: typeof fetch = (...args) => fetch(...args)) => {
  const seen = new Map<string, number>();
  const pending = new Map<string, Promise<void>>();
  return (event: ProductEvent): Promise<void> => {
    const now = Date.now();

    for (const [id, expires] of seen) if (expires <= now) seen.delete(id);

    if (seen.has(event.id)) return Promise.resolve();

    const existing = pending.get(event.id);

    if (existing) return existing;
    if (seen.size + pending.size >= 10000) return Promise.reject(new Error("TELEMETRY_CAPACITY"));

    const delivery = (async () => {
      let response: Response;

      try {
        response = await fetcher("https://stats.nowly.me/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 NowlyProductTelemetry/1.0"
          },
          body: JSON.stringify(umamiPayload(event)),
          signal: AbortSignal.timeout(3000),
          redirect: "error"
        });
      } catch (error) {
        throw new TelemetryRelayError("TELEMETRY_UNAVAILABLE", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: error instanceof Error ? error.message.slice(0, RESPONSE_BODY_LOG_LIMIT) : "Unknown error"
        });
      }

      if (!response.ok) {
        throw new TelemetryRelayError("TELEMETRY_UNAVAILABLE", {
          upstreamStatus: response.status,
          upstreamBody: (await response.text()).slice(0, RESPONSE_BODY_LOG_LIMIT)
        });
      }

      let receipt: unknown;

      try {
        receipt = await response.json();
      } catch (error) {
        throw new TelemetryRelayError("TELEMETRY_UNAVAILABLE", {
          upstreamStatus: response.status,
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: error instanceof Error ? error.message.slice(0, RESPONSE_BODY_LOG_LIMIT) : "Invalid JSON"
        });
      }

      if (!receipt || typeof receipt !== "object" || !("cache" in receipt) || typeof receipt.cache !== "string" || !receipt.cache) {
        throw new TelemetryRelayError("TELEMETRY_UNAVAILABLE", { upstreamStatus: response.status });
      }

      seen.set(event.id, now + 86400000);
    })().finally(() => pending.delete(event.id));
    pending.set(event.id, delivery);
    return delivery;
  };
};

const TELEMETRY_BODY_LIMIT = 1024;

export const createTelemetryRoutes = (relay = createRelay()) =>
  new Hono().post(
    "/events",
    async (c, next) => {
      c.header("Cache-Control", "no-store");
      await next();
    },
    rateLimit({
      name: "telemetry",
      max: 30,
      windowMs: MINUTE_MS
    }),
    bodyLimit({
      maxSize: TELEMETRY_BODY_LIMIT,
      onError: (c) => c.json({ error: "INVALID_TELEMETRY" }, 413)
    }),
    async (c) => {
      const parsed = ingestSchema.safeParse(await jsonBody(c));

      if (!parsed.success) return c.json({ error: "INVALID_TELEMETRY" }, 400);
      if (process.env.NODE_ENV !== "production") return c.json({ error: "TELEMETRY_DISABLED" }, 503);

      try {
        await relay(parsed.data.event);
        return c.json({ ok: true });
      } catch (error) {
        const diagnostic = error instanceof TelemetryRelayError ? error.diagnostic : { errorName: "UnknownError" };
        console.error("Telemetry relay to Umami failed", diagnostic);
        return c.json({ error: "TELEMETRY_UNAVAILABLE" }, 503);
      }
    }
  );