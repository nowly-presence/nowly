export const ANALYTICS_RANGE_IDS = ["1h", "3h", "24h", "3d", "7d", "14d", "30d"] as const

export type AnalyticsRangeId = (typeof ANALYTICS_RANGE_IDS)[number]
export type AnalyticsGranularity = "second" | "minute" | "hour" | "day"

export type AnalyticsRange = {
  id: AnalyticsRangeId
  label: string
  ms: number
  defaultGranularity: AnalyticsGranularity
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const ANALYTICS_RANGES: Record<AnalyticsRangeId, AnalyticsRange> = {
  "1h": { id: "1h", label: "1 hour", ms: HOUR, defaultGranularity: "second" },
  "3h": { id: "3h", label: "3 hours", ms: 3 * HOUR, defaultGranularity: "minute" },
  "24h": { id: "24h", label: "24 hours", ms: DAY, defaultGranularity: "minute" },
  "3d": { id: "3d", label: "3 days", ms: 3 * DAY, defaultGranularity: "hour" },
  "7d": { id: "7d", label: "7 days", ms: 7 * DAY, defaultGranularity: "hour" },
  "14d": { id: "14d", label: "14 days", ms: 14 * DAY, defaultGranularity: "hour" },
  "30d": { id: "30d", label: "30 days", ms: 30 * DAY, defaultGranularity: "day" },
}

export const isAnalyticsRangeId = (value: unknown): value is AnalyticsRangeId =>
  typeof value === "string" && value in ANALYTICS_RANGES

export const resolveRange = (value: unknown, fallback: AnalyticsRangeId = "7d"): AnalyticsRange => {
  if (isAnalyticsRangeId(value)) return ANALYTICS_RANGES[value]
  return ANALYTICS_RANGES[fallback]
}

export const autoGranularity = (rangeId: AnalyticsRangeId): AnalyticsGranularity =>
  ANALYTICS_RANGES[rangeId].defaultGranularity

export const resolveGranularity = (
  rangeId: AnalyticsRangeId,
  requested?: string,
): AnalyticsGranularity => {
  if (requested === "second" || requested === "minute" || requested === "hour" || requested === "day") {
    return requested
  }
  return autoGranularity(rangeId)
}

export const rangeWindow = (range: AnalyticsRange, now = new Date()) => {
  const to = now
  const from = new Date(now.getTime() - range.ms)
  return { from, to }
}
