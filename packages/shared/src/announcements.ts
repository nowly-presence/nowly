import { z } from "zod";

export const ANNOUNCEMENT_LIMIT = 100;
export const ANNOUNCEMENT_BODY_LIMIT = 131_072;
export const ANNOUNCEMENT_FEED_LIMIT = 3_000_000;
const timestamp = z.iso.datetime({ offset: true });
export const ANNOUNCEMENT_LOCALES = ["en", "fr", "es", "de", "pt-BR", "pl", "ja", "ko", "tr", "ms", "el"] as const;

export type AnnouncementLocale = (typeof ANNOUNCEMENT_LOCALES)[number];

const TranslationSchema = z.strictObject({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(600),
  content: z.string().trim().max(20_000).default("")
});
const TranslationsSchema = z
  .partialRecord(z.enum(ANNOUNCEMENT_LOCALES), TranslationSchema)
  .refine((value) => Object.keys(value).length > 0, "At least one translation is required")
  .refine((value) => new TextEncoder().encode(JSON.stringify(value)).byteLength <= 24_000, "Translations exceed 24000 bytes");
const fields = {
  translations: TranslationsSchema,
  kind: z.enum(["normal", "warning", "maintenance"]),
  severity: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3)
    ])
    .nullable()
    .default(null),
  pinned: z.boolean().default(false),
  startsAt: timestamp.nullable().default(null),
  endsAt: timestamp.nullable().default(null),
  expiresAt: timestamp.nullable().default(null)
};

const validWindow = (value: { startsAt: string | null; endsAt: string | null; expiresAt: string | null }) =>
  (!value.startsAt || !value.endsAt || Date.parse(value.startsAt) < Date.parse(value.endsAt)) &&
  (!value.startsAt || !value.expiresAt || Date.parse(value.startsAt) < Date.parse(value.expiresAt)) &&
  (!value.endsAt || !value.expiresAt || Date.parse(value.endsAt) <= Date.parse(value.expiresAt));

const validSeverity = (value: { kind: string; severity: number | null }) => (value.kind === "warning") === (value.severity !== null);

export const AnnouncementInputSchema = z
  .strictObject(fields)
  .refine(validWindow, "Invalid date order")
  .refine(validSeverity, "Only warnings require severity 1, 2 or 3");

export const AnnouncementSchema = z
  .strictObject({
    ...fields,
    id: z.string().min(1).max(100),
    source: z.enum(["announcement", "changelog"]),
    publishedAt: timestamp,
    updatedAt: timestamp
  })
  .refine(validWindow)
  .refine(validSeverity);

export const AnnouncementFeedSchema = z.strictObject({ items: z.array(AnnouncementSchema).max(ANNOUNCEMENT_LIMIT) });

export type AnnouncementInput = z.infer<typeof AnnouncementInputSchema>;
export type Announcement = z.infer<typeof AnnouncementSchema>;
export type AnnouncementFeed = z.infer<typeof AnnouncementFeedSchema>;

export const selectAnnouncementTranslation = (item: Pick<Announcement, "translations">, locale: string) => {
  const requested = ANNOUNCEMENT_LOCALES.find((supported) => supported === locale);
  const translation = requested ? item.translations[requested] : undefined;
  return translation ?? item.translations.en ?? ANNOUNCEMENT_LOCALES.flatMap((key) => (item.translations[key] ? [item.translations[key]] : []))[0];
};

export const isAnnouncementVisible = (item: Announcement, now = Date.now()): boolean =>
  Date.parse(item.publishedAt) <= now && (!item.startsAt || Date.parse(item.startsAt) <= now) && (!item.expiresAt || Date.parse(item.expiresAt) > now);

export const isAnnouncementBannerEligible = (item: Announcement, now = Date.now()): boolean =>
  item.pinned && isAnnouncementVisible(item, now) && (!item.endsAt || Date.parse(item.endsAt) > now);

export const announcementRevision = (item: Announcement): string => `${item.id}:${item.updatedAt}`;