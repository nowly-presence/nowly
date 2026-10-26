import { z } from "zod";

export const categories = ["streaming", "music", "video", "social", "gaming", "tools", "ai", "learning", "creator", "other"] as const;

export const categoryOf = (value: unknown): (typeof categories)[number] => categories.find((category) => category === value) ?? "other";

const source = z.enum(["web", "extension", "restore", "system"]);
const category = z.enum(categories);
const empty = z.strictObject({});
const date = z.iso.date();
const presence = z.strictObject({ category });

const variant = <N extends string, D extends z.ZodType>(name: N, data: D) =>
  z.strictObject({
    id: z.uuid(),
    name: z.literal(name),
    source,
    data
  });

export const eventSchema = z
  .discriminatedUnion("name", [
    variant("site_visit", z.strictObject({ page: z.enum(["home", "library", "presence"]) })),
    variant("extension_download_click", z.strictObject({ browser: z.enum(["chrome", "firefox"]) })),
    variant("extension_first_seen", z.strictObject({ cohort_day: date })),
    variant("extension_active", empty),
    variant("onboarding_completed", empty),
    variant("native_connected", empty),
    variant("presence_install_requested", empty),
    variant("presence_install_failed", z.strictObject({ stage: z.enum(["verification", "registration", "download"]) })),
    variant("presence_installed", presence),
    variant("presence_updated", presence),
    variant("presence_removed", presence),
    variant("presence_enabled", presence),
    variant("presence_disabled", presence),
    variant(
      "presence_used",
      z.strictObject({
        category,
        origin: z.enum(["store", "bundle", "local", "custom"])
      })
    ),
    variant(
      "retention_return",
      z.strictObject({
        cohort_day: date,
        day: z.union([
          z.literal(1),
          z.literal(7),
          z.literal(30)
        ])
      })
    ),
    variant("uninstall_page_opened", empty)
  ])
  .refine((event) => {
    if (event.name === "site_visit" || event.name === "extension_download_click" || event.name === "uninstall_page_opened") return event.source === "web";
    if (
      event.name === "extension_first_seen" ||
      event.name === "extension_active" ||
      event.name === "onboarding_completed" ||
      event.name === "native_connected" ||
      event.name === "presence_used" ||
      event.name === "retention_return"
    ) return event.source === "extension";

    return true;
  });

export type ProductEvent = z.infer<typeof eventSchema>;
export type EventInput = ProductEvent extends infer E ? (E extends ProductEvent ? Omit<E, "id"> : never) : never;

export const ingestSchema = z.strictObject({
  consent: z.literal(true),
  event: eventSchema
});

export const umamiPayload = (event: ProductEvent) => {
  const channel = event.name === "site_visit" || event.name === "extension_download_click" || event.name === "uninstall_page_opened" ? "web" : "extension";

  return {
    type: "event",
    payload: {
      website: channel === "web" ? "b68279a9-5bcc-454a-9147-37fdef5dbebf" : "55bb24f3-93b3-4738-a1f7-7c214027c7e6",
      hostname: "nowly.me",
      url: `/product/${channel}`,
      name: event.name,
      data: {
        schema_version: 1,
        source: event.source,
        ...event.data
      }
    }
  };
};

export type RetentionState = {
  startedAt: number;
  returned: number[];
};

export const localStateSchema = z.strictObject({
  startedAt: z.number().finite().nonnegative(),
  returned: z
    .array(
      z.union([
        z.literal(1),
        z.literal(7),
        z.literal(30)
      ])
    )
    .max(3),
  daily: z.record(z.string().max(80), date),
  once: z.array(z.string().max(40)).max(10)
});

export const retentionPlan = (state: RetentionState, now: number): {
  cohort_day: string;
  day: 1 | 7 | 30;
} | null => {
  const elapsed = Math.floor((now - state.startedAt) / 86400000);

  if ((elapsed !== 1 && elapsed !== 7 && elapsed !== 30) || state.returned.includes(elapsed)) return null;

  return {
    cohort_day: new Date(state.startedAt).toISOString().slice(0, 10),
    day: elapsed
  };
};

export const sendEvent = async (url: string, input: EventInput, consent: () => boolean | Promise<boolean>): Promise<boolean> => {
  if (!(await consent())) return false;

  const event = eventSchema.safeParse({
    ...input,
    id: crypto.randomUUID()
  });

  if (!event.success) return false;

  try {
    if (!(await consent())) return false;

    const response = await fetch(`${url.replace(/\/$/, "")}/telemetry/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        consent: true,
        event: event.data
      })
    });
    return response.ok;
  } catch {
    return false;
  }
};