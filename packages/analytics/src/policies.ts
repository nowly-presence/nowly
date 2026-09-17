import { getAnalyticsMetric } from "./catalog"

export const FORBIDDEN_PAYLOAD_KEYS: readonly string[] = [
  "url",
  "href",
  "title",
  "query",
  "search",
  "content",
  "channel",
  "profile",
  "ip",
  "userAgent",
  "history",
  "discordId",
  "discordUserId",
]

export const FORBIDDEN_PAYLOAD_KEYS_SET: ReadonlySet<string> = new Set(FORBIDDEN_PAYLOAD_KEYS)

// Where an action originated from. First-class column on AnalyticsEvent (not
// a payload key) since it's filtered/combined on almost every query.
export const ANALYTICS_SOURCES = [
  "web_library",
  "extension_library",
  "extension_onboarding",
  "direct_link",
  "native",
  "system",
] as const

export type AnalyticsSource = (typeof ANALYTICS_SOURCES)[number]

export const isAnalyticsSource = (value: unknown): value is AnalyticsSource =>
  typeof value === "string" && (ANALYTICS_SOURCES as readonly string[]).includes(value)

export const MAX_ANALYTICS_EVENTS_PER_BATCH = 100
export const MAX_ANALYTICS_EVENTS_PER_DEVICE_PER_MINUTE = 120
export const DEFAULT_TEXT_MAX_LENGTH = 160

export type MetricPolicy = {
  key: string
  private: boolean
  allowedPayloadKeys: readonly string[]
  retentionDays?: number
}

export const policyForKey = (key: string): MetricPolicy | undefined => {
  const metric = getAnalyticsMetric(key)
  if (!metric) return undefined
  return {
    key: metric.key,
    private: metric.private,
    allowedPayloadKeys: metric.allowedPayloadKeys,
    retentionDays: metric.retentionDays,
  }
}
