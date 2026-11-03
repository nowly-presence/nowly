import { ContactEmailNotConfiguredError, contactMessageSchema, sendContactMessage } from "@/features/contact/contact.service";
import { MINUTE_MS, rateLimit } from "@/middleware/rate-limit";
import { jsonBody } from "@/shared/request-body";
import { Hono } from "hono";

const CONTACT_WINDOW_MS = 10 * MINUTE_MS;

export const contactRoutes = new Hono().post(
  "/",
  rateLimit({
    name: "contact",
    max: 5,
    windowMs: CONTACT_WINDOW_MS
  }),
  async (c) => {
    const parsed = contactMessageSchema.safeParse(await jsonBody(c));

    if (!parsed.success) return c.json({ error: "INVALID_CONTACT_FORM" }, 400);

    if (parsed.data.website) return c.json({ ok: true });

    try {
      await sendContactMessage(parsed.data);
      return c.json({ ok: true });
    } catch (error) {
      if (error instanceof ContactEmailNotConfiguredError) return c.json({ error: "CONTACT_SERVICE_UNAVAILABLE" }, 503);

      console.error("contact email delivery failed");
      return c.json({ error: "CONTACT_SERVICE_UNAVAILABLE" }, 502);
    }
  }
);