import { z } from "zod";

export const categories = ["streaming", "music", "video", "social", "gaming", "tools", "ai", "learning", "creator", "other"] as const;

export const categoryOf = (value: unknown): (typeof categories)[number] => categories.find((category) => category === value) ?? "other";

const source = z.enum(["web", "extension", "restore", "system"]);
const category = z.enum(categories);
const empty = z.strictObject({});
const date = z.iso.date();
const presence = z.strictObject({ category });
const retentionDays = [1, 7, 30] as const;
const retentionDay = z.literal(retentionDays);

const variant = <N extends string, D extends z.ZodRawShape>(name: N, data: z.ZodObject<D>) =>
  z.strictObject({
    id: z.uuid(),
    name: z.literal(name),
    source,
    data: data.extend({ canary: z.literal(true).optional() })
  });

const webEvents = [
  variant("extension_download_click", z.strictObject({ browser: z.enum(["chrome", "firefox"]) })),
  variant("uninstall_page_opened", empty)
] as const;

const extensionEvents = [
  variant("extension_first_seen", z.strictObject({ cohort_day: date })),
  variant("extension_active", empty),
  variant("onboarding_completed", empty),
  variant("native_connected", empty),
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
      day: retentionDay
    })
  )
] as const;

const webEventNames = new Set<string>(webEvents.map((event) => event.shape.name.value));
const extensionEventNames = new Set<string>(extensionEvents.map((event) => event.shape.name.value));

const CHANNELS = {
  web: "b68279a9-5bcc-454a-9147-37fdef5dbebf",
  extension: "55bb24f3-93b3-4738-a1f7-7c214027c7e6"
} as const;

type Channel = keyof typeof CHANNELS;

const channelOf = (name: string): Channel | null => {
  if (webEventNames.has(name)) return "web";
  if (extensionEventNames.has(name)) return "extension";

  return null;
};

export const eventSchema = z
  .discriminatedUnion("name", [
    ...webEvents,
    ...extensionEvents,
    variant("presence_install_requested", empty),
    variant("presence_install_failed", z.strictObject({ stage: z.enum(["verification", "registration", "download"]) })),
    variant("presence_installed", presence),
    variant("presence_updated", presence),
    variant("presence_removed", presence),
    variant("presence_enabled", presence),
    variant("presence_disabled", presence)
  ])
  .refine((event) => {
    const channel = channelOf(event.name);

    return channel === null || event.source === channel;
  });

export type ProductEvent = z.infer<typeof eventSchema>;
export type EventInput = ProductEvent extends infer E ? (E extends ProductEvent ? Omit<E, "id"> : never) : never;

export const ingestSchema = z.strictObject({
  consent: z.literal(true),
  event: eventSchema
});

export const umamiPayload = (event: ProductEvent) => {
  const channel = channelOf(event.name) ?? "extension";

  return {
    type: "event",
    payload: {
      website: CHANNELS[channel],
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
  returned: z.array(retentionDay).max(retentionDays.length),
  daily: z.record(z.string().max(80), date),
  once: z.array(z.string().max(40)).max(10)
});

export const retentionPlan = (state: RetentionState, now: number): {
  cohort_day: string;
  day: (typeof retentionDays)[number];
} | null => {
  const elapsed = Math.floor((now - state.startedAt) / 86400000);
  const day = retentionDays.find((day) => day === elapsed);

  if (day === undefined || state.returned.includes(day)) return null;

  return {
    cohort_day: new Date(state.startedAt).toISOString().slice(0, 10),
    day
  };
};

export const sendEvent = async (url: string, input: EventInput, consent: () => boolean | Promise<boolean>, options?: {
  canary: true;
}): Promise<boolean> => {
  if (!(await consent())) return false;

  const event = eventSchema.safeParse({
    ...input,
    ...(options?.canary
      ? {
          data: {
            ...input.data,
            canary: true
          }
        }
      : {}),
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