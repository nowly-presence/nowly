import { getPrisma, hasDatabase } from "@/db/client"
import {
  catalogPublicJson,
  getAnalyticsMetric,
  getFunnel,
  ingestEventsBodySchema,
  listFunnels,
  MAX_ANALYTICS_EVENTS_PER_BATCH,
  MAX_ANALYTICS_EVENTS_PER_DEVICE_PER_MINUTE,
  measureFunnel,
  resolveGranularity,
  resolveRange,
  sanitizeDeviceId,
  sanitizeEventId,
  sanitizeEventKey,
  sanitizePayload,
  sanitizeSlug,
  sanitizeVersion,
  stepKeys,
  type AnalyticsGranularity,
  type FunnelEventRow,
  type IngestEvent,
} from "@nowly/analytics"
import { Prisma } from "../../generated/prisma/client"

export type InsightsRecordResult = {
  inserted: number
  rejected: number
  duplicates: number
}

type LiveEvent = {
  eventId: string
  key: string
  createdAt: number
}

const FIVE_MINUTES_MS = 5 * 60_000
const MAX_RATE_LIMIT_BUCKETS = 50_000
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()
const liveBuffer: LiveEvent[] = []

const pruneLiveBuffer = (now = Date.now()): void => {
  const cutoff = now - FIVE_MINUTES_MS
  while (liveBuffer.length > 0 && liveBuffer[0]!.createdAt < cutoff) {
    liveBuffer.shift()
  }
}

export const rememberLiveEvent = (event: LiveEvent): void => {
  liveBuffer.push(event)
  pruneLiveBuffer(event.createdAt)
}

export const getLiveSnapshot = (now = Date.now()) => {
  pruneLiveBuffer(now)
  const last60 = now - 60_000
  const last5m = now - FIVE_MINUTES_MS
  const counts = new Map<string, { last60s: number; last5m: number }>()
  let last60s = 0
  let last5mCount = 0
  for (const event of liveBuffer) {
    if (event.createdAt >= last5m) {
      last5mCount += 1
      const entry = counts.get(event.key) ?? { last60s: 0, last5m: 0 }
      entry.last5m += 1
      if (event.createdAt >= last60) {
        last60s += 1
        entry.last60s += 1
      }
      counts.set(event.key, entry)
    }
  }
  const top = [...counts.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.last60s - a.last60s || b.last5m - a.last5m)
    .slice(0, 12)
  return {
    at: new Date(now).toISOString(),
    last60s,
    last5m: last5mCount,
    top,
  }
}

const pruneRateLimitBuckets = (now: number): void => {
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key)
  }
  if (rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    const oldestKey = rateLimitBuckets.keys().next().value
    if (oldestKey) rateLimitBuckets.delete(oldestKey)
  }
}

const takeRateLimitSlot = (deviceId: string | undefined): boolean => {
  if (!deviceId) return true
  const now = Date.now()
  const current = rateLimitBuckets.get(deviceId)
  if (!current || current.resetAt <= now) {
    if (rateLimitBuckets.size >= MAX_RATE_LIMIT_BUCKETS) pruneRateLimitBuckets(now)
    rateLimitBuckets.set(deviceId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (current.count >= MAX_ANALYTICS_EVENTS_PER_DEVICE_PER_MINUTE) return false
  current.count += 1
  return true
}

const normalizeCreatedAt = (value: unknown): Date => {
  if (typeof value === "string") {
    const date = new Date(value)
    const now = Date.now()
    if (!Number.isNaN(date.getTime()) && date.getTime() <= now + 5 * 60_000 && date.getTime() >= now - 7 * 24 * 60 * 60_000) {
      return date
    }
  }
  return new Date()
}

export const parseIngestBody = (body: unknown) => ingestEventsBodySchema.safeParse(body)

export const recordInsightEvents = async (events: IngestEvent[]): Promise<InsightsRecordResult> => {
  if (!hasDatabase()) return { inserted: 0, rejected: 0, duplicates: 0 }

  const prisma = getPrisma()
  let inserted = 0
  let rejected = 0
  let duplicates = 0

  for (const event of events.slice(0, MAX_ANALYTICS_EVENTS_PER_BATCH)) {
    const key = sanitizeEventKey(event.key)
    const metric = key ? getAnalyticsMetric(key) : undefined
    if (!key || !metric) {
      rejected += 1
      continue
    }

    const deviceId = sanitizeDeviceId(event.deviceId)
    if (!takeRateLimitSlot(deviceId)) {
      rejected += 1
      continue
    }

    const eventId = sanitizeEventId(event.eventId) ?? crypto.randomUUID()
    const createdAt = normalizeCreatedAt(event.createdAt)
    const payload = sanitizePayload(key, event.payload)

    try {
      await prisma.analyticsEvent.create({
        data: {
          eventId,
          key,
          deviceId,
          slug: sanitizeSlug(event.slug),
          version: sanitizeVersion(event.version),
          payload: payload as Prisma.InputJsonObject,
          createdAt,
        },
      })
      inserted += 1
      rememberLiveEvent({ eventId, key, createdAt: createdAt.getTime() })
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : ""
      if (code === "P2002") {
        duplicates += 1
        continue
      }
      rejected += 1
    }
  }

  return { inserted, rejected, duplicates }
}

export const getCatalogPayload = () => ({
  metrics: catalogPublicJson(),
  funnels: listFunnels().map((funnel) => ({
    id: funnel.id,
    label: funnel.label,
    steps: funnel.steps.map((step) => ({
      keys: stepKeys(step),
      label: step.label ?? stepKeys(step).join(" | "),
    })),
  })),
})

export const getOverview = async (rangeValue: unknown) => {
  const range = resolveRange(rangeValue)
  if (!hasDatabase()) {
    return {
      range: range.id,
      from: new Date(Date.now() - range.ms).toISOString(),
      to: new Date().toISOString(),
      totals: { events: 0, uniqueDevices: 0 },
      topEvents: [] as Array<{ key: string; count: number }>,
      funnels: listFunnels().map((funnel) => ({ id: funnel.id, label: funnel.label, overallConversion: null as number | null })),
    }
  }

  const prisma = getPrisma()
  const to = new Date()
  const from = new Date(to.getTime() - range.ms)
  const where = { createdAt: { gte: from, lte: to } }

  const [events, uniqueDevices, grouped] = await Promise.all([
    prisma.analyticsEvent.count({ where }),
    prisma.analyticsEvent.groupBy({
      by: ["deviceId"],
      where: { ...where, deviceId: { not: null } },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["key"],
      where,
      _count: { _all: true },
      orderBy: { _count: { key: "desc" } },
      take: 12,
    }),
  ])

  const funnels = await Promise.all(
    listFunnels().map(async (funnel) => {
      const measurement = await getFunnelMeasurement(funnel.id, rangeValue)
      return {
        id: funnel.id,
        label: funnel.label,
        overallConversion: measurement?.overallConversion ?? null,
      }
    }),
  )

  return {
    range: range.id,
    from: from.toISOString(),
    to: to.toISOString(),
    totals: { events, uniqueDevices: uniqueDevices.length },
    topEvents: grouped.map((row) => ({ key: row.key, count: row._count._all })),
    funnels,
  }
}

const truncExpr = (granularity: AnalyticsGranularity) => {
  if (granularity === "second") return Prisma.sql`date_trunc('second', created_at)`
  if (granularity === "minute") return Prisma.sql`date_trunc('minute', created_at)`
  if (granularity === "hour") return Prisma.sql`date_trunc('hour', created_at)`
  return Prisma.sql`date_trunc('day', created_at)`
}

export const getSeries = async (metric: string, rangeValue: unknown, granularityValue?: string) => {
  const catalogMetric = getAnalyticsMetric(metric)
  if (!catalogMetric) return null

  const range = resolveRange(rangeValue)
  const granularity = resolveGranularity(range.id, granularityValue)
  const to = new Date()
  const from = new Date(to.getTime() - range.ms)

  if (!hasDatabase()) {
    return {
      metric: catalogMetric.toJSON(),
      range: range.id,
      granularity,
      from: from.toISOString(),
      to: to.toISOString(),
      points: [] as Array<{ bucket: string; count: number }>,
      total: 0,
    }
  }

  const prisma = getPrisma()
  const rows = await prisma.$queryRaw<Array<{ bucket: Date; count: number }>>`
    SELECT ${truncExpr(granularity)} AS bucket, COUNT(*)::int AS count
    FROM analytics_events
    WHERE key = ${metric} AND created_at >= ${from} AND created_at <= ${to}
    GROUP BY 1
    ORDER BY 1
  `

  const points = rows.map((row) => ({
    bucket: row.bucket.toISOString(),
    count: Number(row.count),
  }))

  return {
    metric: catalogMetric.toJSON(),
    range: range.id,
    granularity,
    from: from.toISOString(),
    to: to.toISOString(),
    points,
    total: points.reduce((sum, point) => sum + point.count, 0),
  }
}

export const getFunnelMeasurement = async (id: string, rangeValue: unknown) => {
  const funnel = getFunnel(id)
  if (!funnel) return null

  const range = resolveRange(rangeValue)
  const to = new Date()
  const from = new Date(to.getTime() - range.ms)
  const keys = funnel.steps.flatMap(stepKeys)

  if (!hasDatabase()) {
    return { range: range.id, from: from.toISOString(), to: to.toISOString(), ...measureFunnel(funnel, []) }
  }

  const prisma = getPrisma()
  const rows = await prisma.analyticsEvent.findMany({
    where: {
      key: { in: keys },
      deviceId: { not: null },
      createdAt: { gte: from, lte: to },
    },
    select: { key: true, deviceId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const funnelRows: FunnelEventRow[] = rows.flatMap((row) =>
    row.deviceId ? [{ key: row.key, deviceId: row.deviceId, createdAt: row.createdAt }] : [],
  )

  return {
    range: range.id,
    from: from.toISOString(),
    to: to.toISOString(),
    ...measureFunnel(funnel, funnelRows),
  }
}

export const listFunnelSummaries = async (rangeValue: unknown) => {
  const measurements = await Promise.all(listFunnels().map((funnel) => getFunnelMeasurement(funnel.id, rangeValue)))
  return measurements.filter((item): item is NonNullable<typeof item> => Boolean(item))
}
