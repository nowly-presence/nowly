import { ingestSchema, umamiPayload, type ProductEvent } from "@nowly/telemetry";
import type { FastifyInstance } from "fastify";

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
      const response = await fetcher("https://stats.nowly.me/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 NowlyProductTelemetry/1.0"
        },
        body: JSON.stringify(umamiPayload(event)),
        signal: AbortSignal.timeout(3000),
        redirect: "error"
      });

      if (!response.ok) throw new Error("TELEMETRY_UNAVAILABLE");

      const receipt: unknown = await response.json();

      if (!receipt || typeof receipt !== "object" || !("cache" in receipt) || typeof receipt.cache !== "string" || !receipt.cache) {
        throw new Error("TELEMETRY_UNAVAILABLE");
      }

      seen.set(event.id, now + 86400000);
    })().finally(() => pending.delete(event.id));
    pending.set(event.id, delivery);
    return delivery;
  };
};

export const telemetryRoutes = async (app: FastifyInstance) => {
  const relay = createRelay();
  app.setErrorHandler((error, _request, reply) => {
    const statusCode = error && typeof error === "object" && "statusCode" in error ? error.statusCode : null;
    const status = typeof statusCode === "number" && statusCode >= 400 && statusCode < 500 ? statusCode : 500;
    return reply
      .code(status)
      .header("Cache-Control", "no-store")
      .send({ error: status === 429 ? "RATE_LIMITED" : "INVALID_TELEMETRY" });
  });
  app.post(
    "/events",
    {
      bodyLimit: 1024,
      config: {
        rateLimit: {
          max: 30,
          timeWindow: "1 minute"
        }
      }
    },
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");
      const parsed = ingestSchema.safeParse(request.body);

      if (!parsed.success) return reply.code(400).send({ error: "INVALID_TELEMETRY" });
      if (process.env.NODE_ENV !== "production") return reply.code(503).send({ error: "TELEMETRY_DISABLED" });

      try {
        await relay(parsed.data.event);
        return {
          ok: true
        };
      } catch {
        return reply.code(503).send({ error: "TELEMETRY_UNAVAILABLE" });
      }
    }
  );
};