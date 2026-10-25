import { hasAdminAuth } from "@/features/auth/auth.middleware";
import { createAnnouncement, getAnnouncementFeed } from "@/features/announcements/announcements.service";
import { ANNOUNCEMENT_BODY_LIMIT, ANNOUNCEMENT_LOCALES, AnnouncementInputSchema } from "@nowly/shared/announcements";
import type { FastifyInstance } from "fastify";
import type { ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { z } from "zod";

const QuerySchema = z.strictObject({ locale: z.enum(ANNOUNCEMENT_LOCALES).default("en") });
const MAX_CLIENTS = 128;
const POLL_MS = 2_000;
const MAX_STREAM_MS = 5 * 60_000;
const MAX_BUFFER = 16_384;

export const announcementsRoutes = async (server: FastifyInstance) => {
  const clients = new Set<ServerResponse>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let checking = false;
  let previous = "";
  let ticks = 0;
  const invalidate = () => {
    for (const client of clients) {
      if (client.destroyed || client.writableLength > MAX_BUFFER) {
        client.end();
        continue;
      }

      client.write("event: invalidate\ndata: {}\n\n");
    }
  };
  const check = async () => {
    if (checking || !clients.size) return;

    checking = true;

    try {
      if (++ticks % 10 === 0) {
        for (const client of clients) {
          if (client.destroyed || client.writableLength > MAX_BUFFER) client.end();
          else client.write(": heartbeat\n\n");
        }
      }

      const feed = await getAnnouncementFeed("en");

      const revision = createHash("sha256").update(JSON.stringify(feed)).digest("hex");

      if (revision !== previous) {
        previous = revision;
        invalidate();
      }
    } catch {
    } finally {
      checking = false;
    }
  };
  server.addHook("preClose", async () => {
    clearInterval(timer);

    for (const client of clients) client.end();

    clients.clear();
  });
  server.post(
    "/",
    {
      bodyLimit: ANNOUNCEMENT_BODY_LIMIT,
      onRequest: async (request, reply) => {
        if (!hasAdminAuth(request)) return reply.code(401).send({ error: "UNAUTHORIZED" });
      },
      errorHandler: (error, _request, reply) => {
        if (error.code === "FST_ERR_CTP_BODY_TOO_LARGE") return reply.code(413).send({ error: "ANNOUNCEMENT_TOO_LARGE" });
        if (error.statusCode === 400) return reply.code(400).send({ error: "INVALID_ANNOUNCEMENT" });

        throw error;
      }
    },
    async (request, reply) => {
      const input = AnnouncementInputSchema.safeParse(request.body);

      if (!input.success) return reply.code(400).send({ error: "INVALID_ANNOUNCEMENT" });

      const item = await createAnnouncement(input.data);
      invalidate();
      return reply.code(201).send(item);
    }
  );
  server.get("/", async (request, reply) => {
    const query = QuerySchema.safeParse(request.query);

    if (!query.success) return reply.code(400).send({ error: "INVALID_QUERY" });

    reply.header("Cache-Control", "no-store");
    return getAnnouncementFeed(query.data.locale);
  });
  server.get("/events", async (_request, reply) => {
    if (clients.size >= MAX_CLIENTS) return reply.code(503).send({ error: "STREAM_LIMIT" });

    reply.header("Content-Type", "text/event-stream").header("Cache-Control", "no-store").header("X-Accel-Buffering", "no");

    for (const [name, value] of Object.entries(reply.getHeaders())) {
      if (value !== undefined) reply.raw.setHeader(name, typeof value === "number" ? String(value) : value);
    }

    reply.raw.writeHead(200);
    reply.hijack();
    const client = reply.raw;
    clients.add(client);
    client.write("retry: 5000\nevent: invalidate\ndata: {}\n\n");
    const timeout = setTimeout(() => client.end(), MAX_STREAM_MS);
    client.on("close", () => {
      clearTimeout(timeout);
      clients.delete(client);

      if (!clients.size) {
        clearInterval(timer);
        timer = undefined;
        previous = "";
      }
    });
    timer ??= setInterval(() => void check(), POLL_MS);
  });
};