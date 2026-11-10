import { z } from "zod";
import { PRESENCE_REPORT_MAX_LENGTH, SLUG_MAX_LENGTH } from "./constants";
import { parsePublicLink, PUBLIC_BIO_MAX_LENGTH, PUBLIC_LINKS_MAX } from "./public-profile";
import { EXTENSION_TOKEN_SCOPES, type SyncDocumentKey } from "./sync";

/**
 * Runtime validation schemas for API request bodies.
 *
 * Kept in a dedicated entrypoint (`@nowly/shared/schemas`) so consumers that
 * only need constants/utilities never pull `zod` into their bundle.
 */

const slugSchema = z.string().trim().min(1).max(SLUG_MAX_LENGTH);

const deviceIdSchema = z.uuid();

/** POST /presences/active */
export const presenceActiveBodySchema = z.object({
  presences: z.array(slugSchema).max(500).default([]),
  deviceId: deviceIdSchema.optional()
});

/** A single device-reported presence in a device-sync payload. */
const deviceSyncPresenceSchema = z.object({
  slug: slugSchema,
  version: z.string().trim().max(60).nullish(),
  enabled: z.boolean().optional(),
  installed: z.boolean().optional()
});

/** POST /devices/sync */
export const deviceSyncBodySchema = z.object({
  deviceId: deviceIdSchema,
  extensionVersion: z.string().trim().max(40).optional(),
  nativeVersion: z.string().trim().max(40).optional(),
  browser: z.string().trim().max(60).optional(),
  os: z.string().trim().max(60).optional(),
  locale: z.string().trim().max(20).optional(),
  presences: z.array(deviceSyncPresenceSchema).max(1000).optional()
});

/** PUT /presences/:slug (admin) */
export const presencePutBodySchema = z.object({
  version: z.string().trim().max(60).optional(),
  added: z.string().trim().optional(),
  updated: z.string().trim().optional(),
  changelog: z.string().optional(),
  author: z.string().trim().max(120).optional(),
  authorGithub: z.string().trim().max(120).optional(),
  pr: z.string().trim().max(200).optional()
});

/** POST /presences/:slug/report */
export const presenceReportBodySchema = z.object({
  message: z.string().trim().min(1).max(PRESENCE_REPORT_MAX_LENGTH),
  locale: z.string().trim().max(20).optional(),
  browser: z.string().trim().max(60).optional(),
  browserVersion: z.string().trim().max(40).optional()
});

/** POST/DELETE /presences/:slug/like, GET /presences/:slug/like */
export const presenceLikeBodySchema = z.object({ deviceId: deviceIdSchema });

export const presenceLikeQuerySchema = z.object({ deviceId: deviceIdSchema });

const SYNC_LIST_MAX = 1000;
const SYNC_LOCALE_MAX_LENGTH = 20;
const SYNC_SETTING_KEY_MAX_LENGTH = 120;
const SYNC_TEXT_MAX_LENGTH = 512;
const SYNC_URL_MAX_LENGTH = 2048;
const SYNC_CUSTOM_ACTIVITIES_MAX = 200;
const SYNC_CUSTOM_BUTTONS_MAX = 2;

const syncTimeSchema = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}$/);

const syncScheduleSchema = z.object({
  start: syncTimeSchema.optional(),
  end: syncTimeSchema.optional(),
  days: z.array(z.number().int().min(0).max(6)).max(7)
});

const syncLocaleSchema = z.string().trim().min(1).max(SYNC_LOCALE_MAX_LENGTH);

const syncSettingsSchema = z.object({
  presenceDisplayMode: z.enum(["category", "grid"]).optional(),
  showPlayer: z.boolean().optional(),
  suggestPresences: z.boolean().optional(),
  hiddenSuggestions: z.array(slugSchema).max(SYNC_LIST_MAX).optional(),
  scheduleEnabled: z.boolean().optional(),
  globalSchedule: syncScheduleSchema.optional(),
  appearance: z.enum(["system", "light", "dark"]).optional(),
  seasonalThemes: z.boolean().optional(),
  backgroundAnimation: z.boolean().optional(),
  presenceLanguage: syncLocaleSchema.optional(),
  presenceLanguages: z.record(slugSchema, syncLocaleSchema).optional(),
  activitySelectionMode: z.enum(["focused", "priority"]).optional(),
  activityPriorityOrder: z.array(slugSchema).max(SYNC_LIST_MAX).optional()
});

const syncPresenceEntrySchema = z.object({
  slug: slugSchema,
  enabled: z.boolean(),
  schedule: syncScheduleSchema.optional(),
  installedAt: z.number().int().nonnegative()
});

export const syncPresencesSchema = z.array(syncPresenceEntrySchema).max(SYNC_LIST_MAX);

const syncSettingValueSchema = z.union([
  z.string().max(SYNC_TEXT_MAX_LENGTH),
  z.number(),
  z.boolean(),
  z.null()
]);

const syncPresenceSettingsSchema = z.record(slugSchema, z.record(z.string().max(SYNC_SETTING_KEY_MAX_LENGTH), syncSettingValueSchema));

const syncFeatureRevealsSchema = z.record(z.string().trim().min(1).max(SLUG_MAX_LENGTH), z.number().int().nonnegative());

const syncCustomTextSchema = z.string().max(SYNC_TEXT_MAX_LENGTH);
const syncCustomUrlSchema = z.url().max(SYNC_URL_MAX_LENGTH);

const syncCustomImageSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("url"),
    url: syncCustomUrlSchema
  }),
  z.object({
    kind: z.literal("icon"),
    icon: z.string().trim().min(1).max(40),
    color: z.string().regex(/^#[0-9a-f]{6}$/)
  }),
  z.object({
    kind: z.literal("upload"),
    hash: z.string().regex(/^[0-9a-f]{64}$/),
    mime: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
    size: z.number().int().positive(),
    remoteId: z.string().max(SYNC_TEXT_MAX_LENGTH).optional(),
    remoteUrl: syncCustomUrlSchema.optional()
  })
]);

const syncCustomActivitySchema = z.object({
  id: z.string().trim().min(1).max(SLUG_MAX_LENGTH),
  name: syncCustomTextSchema,
  type: z.union([
    z.literal(0),
    z.literal(2),
    z.literal(3),
    z.literal(5)
  ]),
  details: syncCustomTextSchema,
  state: syncCustomTextSchema,
  largeImage: syncCustomImageSchema,
  largeText: syncCustomTextSchema,
  smallImage: syncCustomImageSchema,
  smallText: syncCustomTextSchema,
  timestamp: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("elapsed") }),
    z.object({
      mode: z.literal("countdown"),
      minutes: z.number().int().positive()
    })
  ]),
  buttons: z
    .array(
      z.object({
        label: syncCustomTextSchema,
        url: syncCustomUrlSchema
      })
    )
    .max(SYNC_CUSTOM_BUTTONS_MAX),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative()
});

export const syncCustomActivitiesSchema = z.object({ items: z.array(syncCustomActivitySchema).max(SYNC_CUSTOM_ACTIVITIES_MAX) });

export const syncDocumentSchemas = {
  settings: syncSettingsSchema,
  presences: syncPresencesSchema,
  presenceSettings: syncPresenceSettingsSchema,
  featureReveals: syncFeatureRevealsSchema,
  customActivities: syncCustomActivitiesSchema
} as const satisfies Record<SyncDocumentKey, z.ZodType>;

export const syncPutBodySchema = z.object({
  value: z.unknown(),
  baseVersion: z.number().int().nonnegative()
});

export const syncChangesQuerySchema = z.object({ since: z.iso.datetime({ offset: true }) });

export const extensionTokenBodySchema = z.object({
  deviceId: deviceIdSchema.optional(),
  scopes: z.array(z.enum(EXTENSION_TOKEN_SCOPES)).min(1).max(EXTENSION_TOKEN_SCOPES.length).default(["sync"])
});

export const publicProfileBodySchema = z.strictObject({
  enabled: z.boolean(),
  bio: z
    .string()
    .trim()
    .max(PUBLIC_BIO_MAX_LENGTH)
    .refine((value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value), "INVALID_BIO")
    .transform((value) => (value ? value : null)),
  showCreated: z.boolean(),
  showLiked: z.boolean(),
  links: z
    .array(z.string().refine((value) => parsePublicLink(value) !== null, "INVALID_LINK"))
    .max(PUBLIC_LINKS_MAX)
    .transform((values) => [...new Set(values.map((value) => parsePublicLink(value)?.toString() ?? value))])
});

export type PublicProfileBody = z.infer<typeof publicProfileBodySchema>;