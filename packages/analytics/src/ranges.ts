export const ANALYTICS_RANGE_IDS = ["1h", "3h", "5h", "24h", "3d", "7d", "10d", "14d", "30d"] as const

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
  "1h": { id: "1h", label: "Last hour", ms: HOUR, defaultGranularity: "second" },
  "3h": { id: "3h", label: "Last 3 hours", ms: 3 * HOUR, defaultGranularity: "minute" },
  "5h": { id: "5h", label: "Last 5 hours", ms: 5 * HOUR, defaultGranularity: "minute" },
  "24h": { id: "24h", label: "Last 24 hours", ms: DAY, defaultGranularity: "minute" },
  "3d": { id: "3d", label: "Last 3 days", ms: 3 * DAY, defaultGranularity: "hour" },
  "7d": { id: "7d", label: "Last 7 days", ms: 7 * DAY, defaultGranularity: "hour" },
  "10d": { id: "10d", label: "Last 10 days", ms: 10 * DAY, defaultGranularity: "hour" },
  "14d": { id: "14d", label: "Last 14 days", ms: 14 * DAY, defaultGranularity: "hour" },
  "30d": { id: "30d", label: "Last 30 days", ms: 30 * DAY, defaultGranularity: "day" },
}

export const isAnalyticsRangeId = (value: unknown): value is AnalyticsRangeId =>
  typeof value === "string" && value in ANALYTICS_RANGES

export const resolveRange = (value: unknown, fallback: AnalyticsRangeId = "7d"): AnalyticsRange => {
  if (isAnalyticsRangeId(value)) return ANALYTICS_RANGES[value]
  return ANALYTICS_RANGES[fallback]
}

export const autoGranularity = (rangeId: AnalyticsRangeId): AnalyticsGranularity =>
  ANALYTICS_RANGES[rangeId].defaultGranularity

export const granularityForMs = (ms: number): AnalyticsGranularity => {
  if (ms <= 3 * HOUR) return "second"
  if (ms <= DAY) return "minute"
  if (ms <= 14 * DAY) return "hour"
  return "day"
}

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

export type ResolvedWindow = {
  range: "custom" | AnalyticsRangeId
  from: Date
  to: Date
  defaultGranularity: AnalyticsGranularity
}

// A custom `from`/`to` pair (ISO date strings) takes priority over the
// `range` id when both are present. Falls back to the "7d" preset when
// neither a valid preset id nor a valid custom pair is given.
export const resolveWindow = (input: { range?: unknown; from?: unknown; to?: unknown }, now = new Date()): ResolvedWindow => {
  if (typeof input.from === "string" && typeof input.to === "string") {
    const from = new Date(input.from)
    const to = new Date(input.to)
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from.getTime() < to.getTime()) {
      return { range: "custom", from, to, defaultGranularity: granularityForMs(to.getTime() - from.getTime()) }
    }
  }

  const range = resolveRange(input.range)
  const { from, to } = rangeWindow(range, now)
  return { range: range.id, from, to, defaultGranularity: range.defaultGranularity }
}

// The immediately preceding window of the same duration, used to compare a
// period against "the same length of time right before it".
export const previousWindow = (from: Date, to: Date): { from: Date; to: Date } => {
  const durationMs = to.getTime() - from.getTime()
  return { from: new Date(from.getTime() - durationMs), to: new Date(from.getTime()) }
}
