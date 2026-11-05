import type { AppEnv } from "@/context";
import { requireSecretOrCapability } from "@/features/admin/admin.middleware";
import { canTranslateAnnouncements, EnglishSourceRequiredError, translateAnnouncement, translateAnnouncementLocale } from "@/features/announcements/announcements.translation";
import { createAnnouncement, deleteAnnouncement, getAnnouncementFeed, listManagedAnnouncements, updateAnnouncement } from "@/features/announcements/announcements.service";
import { jsonBody } from "@/shared/request-body";
import { ANNOUNCEMENT_BODY_LIMIT, ANNOUNCEMENT_LOCALES, AnnouncementInputSchema } from "@nowly/shared/announcements";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { streamSSE, type SSEStreamingApi } from "hono/streaming";
import { createHash } from "node:crypto";
import { z } from "zod";

const TranslateRequestSchema = z.strictObject({
  locale: z.enum(ANNOUNCEMENT_LOCALES).exclude(["en"]),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(600),
  content: z.string().trim().max(20_000).default("")
});
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

  const tooLarge = bodyLimit({
    maxSize: ANNOUNCEMENT_BODY_LIMIT,
    onError: (c) => c.json({ error: "ANNOUNCEMENT_TOO_LARGE" }, 413)
  });

  return new Hono<AppEnv>()
    .get("/manage", requireSecretOrCapability("announce"), async (c) => {
      c.header("Cache-Control", "no-store");
      return c.json({ items: await listManagedAnnouncements() });
    })
    .post("/translate", requireSecretOrCapability("announce"), tooLarge, async (c) => {
      const request = TranslateRequestSchema.safeParse(await jsonBody(c));

      if (!request.success) return c.json({ error: "INVALID_TRANSLATION_REQUEST" }, 400);

      if (!canTranslateAnnouncements()) return c.json({ error: "TRANSLATION_UNAVAILABLE" }, 503);

      const { locale, ...source } = request.data;

      try {
        return c.json({
          locale,
          translation: await translateAnnouncementLocale(source, locale)
        });
      } catch {
        return c.json({ error: "TRANSLATION_FAILED" }, 502);
      }
    })
    .put("/:id", requireSecretOrCapability("announce"), tooLarge, async (c) => {
      const input = AnnouncementInputSchema.safeParse(await jsonBody(c));

      if (!input.success) return c.json({ error: "INVALID_ANNOUNCEMENT" }, 400);

      const item = await updateAnnouncement(c.req.param("id"), input.data, c.get("actor"));

      if (!item) return c.json({ error: "NOT_FOUND" }, 404);

      invalidate();
      return c.json(item);
    })
    .delete("/:id", requireSecretOrCapability("announce"), async (c) => {
      if (!(await deleteAnnouncement(c.req.param("id"), c.get("actor")))) return c.json({ error: "NOT_FOUND" }, 404);

      invalidate();
      return c.body(null, 204);
    })
    .post(
      "/",
      requireSecretOrCapability("announce"),
      bodyLimit({
        maxSize: ANNOUNCEMENT_BODY_LIMIT,
        onError: (c) => c.json({ error: "ANNOUNCEMENT_TOO_LARGE" }, 413)
      }),
      async (c) => {
        const body = await jsonBody(c);

        const { translate, ...announcement } =
          body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : { translate: undefined };

        if (translate !== undefined && typeof translate !== "boolean") return c.json({ error: "INVALID_ANNOUNCEMENT" }, 400);

        const input = AnnouncementInputSchema.safeParse(announcement);

        if (!input.success) return c.json({ error: "INVALID_ANNOUNCEMENT" }, 400);

        let prepared = input.data;

        if (translate !== false && canTranslateAnnouncements()) {
          try {
            prepared = await translateAnnouncement(input.data);
          } catch (error) {
            if (error instanceof EnglishSourceRequiredError) return c.json({ error: "ENGLISH_REQUIRED" }, 400);

            return c.json({ error: "TRANSLATION_FAILED" }, 502);
          }
        }

        const item = await createAnnouncement(prepared, c.get("actor"));
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