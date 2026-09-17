/**
 * Cross-package business constants.
 *
 * These values are intentionally shared between the API, the extension and the
 * web app so a single change stays consistent everywhere (limits, validation
 * bounds, payload allow/deny lists, ...).
 */

/**
 * Payload keys that must never be persisted from analytics events because they
 * can carry personally identifying or sensitive browsing information.
 * Used server-side as a hard deny-list on top of the per-metric allow-list.
 */
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

/** Analytics ingestion limits. */
export const MAX_ANALYTICS_EVENTS_PER_BATCH = 100
export const MAX_ANALYTICS_EVENTS_PER_DEVICE_PER_MINUTE = 120

/** Presence slug constraints. */
export const SLUG_MAX_LENGTH = 80
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/

/** Generic text field cap used when sanitizing free-text input. */
export const DEFAULT_TEXT_MAX_LENGTH = 120

/** Public presence-issue reports from the library page. */
export const PRESENCE_REPORT_MAX_LENGTH = 750
