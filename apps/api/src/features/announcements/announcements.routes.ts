import { hasAdminAuth } from "@/features/auth/auth.middleware";
import { createAnnouncement, getAnnouncementFeed } from "@/features/announcements/announcements.service";
import { jsonBody } from "@/shared/request-body";
import { ANNOUNCEMENT_BODY_LIMIT, ANNOUNCEMENT_LOCALES, AnnouncementInputSchema } from "@nowly/shared/announcements";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { streamSSE, type SSEStreamingApi } from "hono/streaming";
import { createHash } from "node:crypto";
import { z } from "zod";

const QuerySchema = z.strictObject({ locale: z.enum(ANNOUNCEMENT_LOCALES).default("en") });
const MAX_CLIENTS = 128;
const POLL_MS = 2_000;
const MAX_STREAM_MS = 5 * 60_000;
const RETRY_MS = 5_000;
const HEARTBEAT_EVERY_TICKS = 10;

export const createAnnouncementsRoutes = () => {
  const clients = new Set<SSEStreamingApi>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let checking = false;
  let previous = "";
  let ticks = 0;

  const send = (client: SSEStreamingApi, write: () => Promise<void>) => {
    write().catch(() => {
      clients.delete(client);
      void client.close();
    });
  };
  const invalidate = () => {
    for (const client of clients)
      send(client, () =>
        client.writeSSE({
          event: "invalidate",
          data: "{}"
        })
      );
  };
  const check = async () => {
    if (checking || !clients.size) return;

    checking = true;

    try {
      if (++ticks % HEARTBEAT_EVERY_TICKS === 0) {
        for (const client of clients) send(client, () => client.write(": heartbeat\n\n").then(() => undefined));
      }

      const feed = await getAnnouncementFeed("en");

      const revision = createHash("sha256").update(JSON.stringify(feed)).digest("hex");

      if (revision !== previous) {
        previous = revision;
        invalidate();
      }
    } catch {
      return;
    } finally {
      checking = false;
    }
  };
  const release = (client: SSEStreamingApi) => {
    clients.delete(client);

    if (clients.size) return;

    clearInterval(timer);
    timer = undefined;
    previous = "";
  };

  return new Hono()
    .post(
      "/",
      async (c, next) => {
        if (!hasAdminAuth(c)) return c.json({ error: "UNAUTHORIZED" }, 401);

        await next();
      },
      bodyLimit({
        maxSize: ANNOUNCEMENT_BODY_LIMIT,
        onError: (c) => c.json({ error: "ANNOUNCEMENT_TOO_LARGE" }, 413)
      }),
      async (c) => {
        const input = AnnouncementInputSchema.safeParse(await jsonBody(c));

        if (!input.success) return c.json({ error: "INVALID_ANNOUNCEMENT" }, 400);

        const item = await createAnnouncement(input.data);
        invalidate();
        return c.json(item, 201);
      }
    )
    .get("/", async (c) => {
      const query = QuerySchema.safeParse(c.req.query());

      if (!query.success) return c.json({ error: "INVALID_QUERY" }, 400);

      c.header("Cache-Control", "no-store");
      return c.json(await getAnnouncementFeed(query.data.locale));
    })
    .get("/events", async (c) => {
      if (clients.size >= MAX_CLIENTS) return c.json({ error: "STREAM_LIMIT" }, 503);

      c.header("Cache-Control", "no-store");
      c.header("X-Accel-Buffering", "no");
      return streamSSE(c, async (stream) => {
        clients.add(stream);
        stream.onAbort(() => release(stream));
        await stream.writeSSE({
          retry: RETRY_MS,
          event: "invalidate",
          data: "{}"
        });
        timer ??= setInterval(() => void check(), POLL_MS);
        await stream.sleep(MAX_STREAM_MS);
        release(stream);
      });
    });
};