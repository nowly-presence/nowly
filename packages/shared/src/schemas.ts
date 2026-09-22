import { z } from "zod"
import {
  PRESENCE_REPORT_MAX_LENGTH,
  SLUG_MAX_LENGTH,
} from "./constants"

/**
 * Runtime validation schemas for API request bodies.
 *
 * Kept in a dedicated entrypoint (`@nowly/shared/schemas`) so consumers that
 * only need constants/utilities never pull `zod` into their bundle.
 */

export const slugSchema = z.string().trim().min(1).max(SLUG_MAX_LENGTH)

export const localeRecordSchema = z.record(z.string(), z.string())

export const deviceIdSchema = z.uuid()

/** POST /presences/active */
export const presenceActiveBodySchema = z.object({
  presences: z.array(slugSchema).max(500).default([]),
  deviceId: deviceIdSchema.optional(),
})
export type PresenceActiveBody = z.infer<typeof presenceActiveBodySchema>

/** A single device-reported presence in a device-sync payload. */
export const deviceSyncPresenceSchema = z.object({
  slug: slugSchema,
  version: z.string().trim().max(60).nullish(),
  enabled: z.boolean().optional(),
  installed: z.boolean().optional(),
})

/** POST /devices/sync */
export const deviceSyncBodySchema = z.object({
  deviceId: deviceIdSchema,
  extensionVersion: z.string().trim().max(40).optional(),
  nativeVersion: z.string().trim().max(40).optional(),
  browser: z.string().trim().max(60).optional(),
  os: z.string().trim().max(60).optional(),
  locale: z.string().trim().max(20).optional(),
  presences: z.array(deviceSyncPresenceSchema).max(1000).optional(),
})
export type DeviceSyncBody = z.infer<typeof deviceSyncBodySchema>

/** PUT /presences/:slug (admin) */
export const presencePutBodySchema = z.object({
  version: z.string().trim().max(60).optional(),
  added: z.string().trim().optional(),
  updated: z.string().trim().optional(),
  changelog: z.string().optional(),
  author: z.string().trim().max(120).optional(),
  authorGithub: z.string().trim().max(120).optional(),
  pr: z.string().trim().max(200).optional(),
})
export type PresencePutBody = z.infer<typeof presencePutBodySchema>

/** POST /presences/:slug/report */
export const presenceReportBodySchema = z.object({
  message: z.string().trim().min(1).max(PRESENCE_REPORT_MAX_LENGTH),
  locale: z.string().trim().max(20).optional(),
})
export type PresenceReportBody = z.infer<typeof presenceReportBodySchema>

/** POST/DELETE /presences/:slug/like, GET /presences/:slug/like */
export const presenceLikeBodySchema = z.object({
  deviceId: deviceIdSchema,
})
export type PresenceLikeBody = z.infer<typeof presenceLikeBodySchema>

export const presenceLikeQuerySchema = z.object({
  deviceId: deviceIdSchema,
})
export type PresenceLikeQuery = z.infer<typeof presenceLikeQuerySchema>
