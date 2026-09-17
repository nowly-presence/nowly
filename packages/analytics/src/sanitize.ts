import { getAnalyticsMetric } from "./catalog"
import { DEFAULT_TEXT_MAX_LENGTH, FORBIDDEN_PAYLOAD_KEYS_SET } from "./policies"

export type SanitizedPayload = Record<string, string | number | boolean>

const cleanText = (value: unknown, max = DEFAULT_TEXT_MAX_LENGTH): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, max)
}

export const sanitizePayload = (key: string, payload: Record<string, unknown> = {}): SanitizedPayload => {
  const metric = getAnalyticsMetric(key)
  const allowedKeys = new Set(metric?.allowedPayloadKeys ?? [])

  return Object.fromEntries(
    Object.entries(payload)
      .filter(([payloadKey]) => allowedKeys.has(payloadKey) && !FORBIDDEN_PAYLOAD_KEYS_SET.has(payloadKey))
      .map(([payloadKey, value]) => {
        if (typeof value === "string") return [payloadKey, cleanText(value, DEFAULT_TEXT_MAX_LENGTH)]
        if (typeof value === "number" || typeof value === "boolean") return [payloadKey, value]
        return [payloadKey, undefined]
      })
      .filter(([, value]) => value !== undefined),
  ) as SanitizedPayload
}

export const sanitizeSlug = (value: unknown): string | undefined =>
  cleanText(value, 80)?.toLowerCase()

export const sanitizeVersion = (value: unknown): string | undefined => cleanText(value, 60)

export const sanitizeDeviceId = (value: unknown): string | undefined => cleanText(value, 120)

export const sanitizeEventKey = (value: unknown): string | undefined => cleanText(value, 100)

export const sanitizeEventId = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 120) return undefined
  return trimmed
}
