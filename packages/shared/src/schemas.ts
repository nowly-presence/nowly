import { z } from "zod"
import {
  MAX_ANALYTICS_EVENTS_PER_BATCH,
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

/** POST /presences/active */
export const presenceActiveBodySchema = z.object({
  presences: z.array(slugSchema).max(500).default([]),
  deviceId: z.string().trim().min(1).max(120).optional(),
})
export type PresenceActiveBody = z.infer<typeof presenceActiveBodySchema>

/** POST /analytics/consent */
export const analyticsConsentBodySchema = z.object({
  deviceId: z.string().trim().min(1).max(120),
  analyticsConsent: z.boolean().optional(),
})

/** A single device-reported presence in a device-sync payload. */
export const deviceSyncPresenceSchema = z.object({
  slug: slugSchema,
  version: z.string().trim().max(60).nullish(),
  enabled: z.boolean().optional(),
  installed: z.boolean().optional(),
})

/** POST /devices/sync */
export const deviceSyncBodySchema = z.object({
  deviceId: z.string().trim().min(1).max(120),
  analyticsConsent: z.boolean().optional(),
  extensionVersion: z.string().trim().max(40).optional(),
  nativeVersion: z.string().trim().max(40).optional(),
  browser: z.string().trim().max(60).optional(),
  os: z.string().trim().max(60).optional(),
  locale: z.string().trim().max(20).optional(),
  presences: z.array(deviceSyncPresenceSchema).max(1000).optional(),
})
export type DeviceSyncBody = z.infer<typeof deviceSyncBodySchema>

/** A single analytics event. */
export const analyticsEventSchema = z.object({
  key: z.string().trim().min(1).max(100),
  deviceId: z.string().trim().max(120).optional(),
  slug: z.string().trim().max(SLUG_MAX_LENGTH).optional(),
  version: z.string().trim().max(60).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().trim().optional(),
})
export type AnalyticsEvent = z.infer<typeof analyticsEventSchema>

/** POST /analytics/events */
export const analyticsEventsBodySchema = z.object({
  events: z.array(analyticsEventSchema).max(MAX_ANALYTICS_EVENTS_PER_BATCH).default([]),
})

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

/** GET /ads/status */
export const adsStatusQuerySchema = z.object({
  deviceId: z.string().trim().min(1).max(120).optional(),
})
export type AdsStatusQuery = z.infer<typeof adsStatusQuerySchema>

/** GET /redeem */
export const redeemQuerySchema = z.object({
  code: z.string().trim().min(8).max(80),
})
export type RedeemQuery = z.infer<typeof redeemQuerySchema>

/** POST /redeem */
export const redeemBodySchema = z.object({
  code: z.string().trim().min(8).max(80),
  deviceId: z.string().trim().min(1).max(120),
})
export type RedeemBody = z.infer<typeof redeemBodySchema>

/** POST /passes */
export const createPassBodySchema = z.object({
  provider: z.string().trim().min(1).max(40).default("manual"),
  providerRef: z.string().trim().max(160).optional(),
  maxDevices: z.coerce.number().int().positive().max(50).optional(),
})
export type CreatePassBody = z.infer<typeof createPassBodySchema>
