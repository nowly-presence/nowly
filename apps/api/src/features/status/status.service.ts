import { getPrisma, hasDatabase } from "@/db/client"
import { serverEnv } from "@nowly/env/server"

export type ServiceStatus = "operational" | "slow" | "degraded" | "down" | "unknown"

export type StatusServiceId = "website" | "api" | "library" | "cdn"

export type StatusSample = {
  serviceId: StatusServiceId
  checkedAt: string
  status: Exclude<ServiceStatus, "unknown">
  responseMs: number | null
  httpStatus: number | null
  error: string | null
}

export type StatusServiceReport = {
  id: StatusServiceId
  current: StatusSample | null
  samples: StatusSample[]
}

export type StatusReport = {
  generatedAt: string
  checkIntervalHours: number
  overallStatus: ServiceStatus
  services: StatusServiceReport[]
}

export type StatusCheckResult = {
  report: StatusReport
  skipped: boolean
}

type StatusService = {
  id: StatusServiceId
  url: string
}

const REQUEST_TIMEOUT_MS = 5000
const RECENT_SAMPLE_COUNT = 10

const sampleStore = new Map<StatusServiceId, StatusSample[]>()

const services: StatusService[] = [
  { id: "website", url: process.env.NEXT_PUBLIC_BASE_URL || "https://nowly.me" },
  { id: "api", url: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me"}/health` },
  { id: "library", url: `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.nowly.me"}/presences` },
  { id: "cdn", url: "https://cdn.nowly.me/installer/latest.json" },
]

const parsePositiveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const getCheckIntervalHours = (): number => serverEnv.STATUS_CHECK_INTERVAL_HOURS

const getSampleLimit = (): number => Math.max(10, serverEnv.STATUS_SAMPLE_LIMIT)

export const classifyResponse = (ok: boolean, httpStatus: number | null, responseMs: number | null): Exclude<ServiceStatus, "unknown"> => {
  if (!ok || httpStatus === null || httpStatus >= 500 || responseMs === null) return "down"
  if (responseMs <= 750) return "operational"
  if (responseMs <= 2000) return "slow"
  return "degraded"
}

const statusWeight: Record<ServiceStatus, number> = {
  operational: 0, slow: 1, degraded: 2, down: 3, unknown: 4,
}

const getWorstStatus = (statuses: ServiceStatus[]): ServiceStatus =>
  statuses.reduce<ServiceStatus>((worst, status) =>
    statusWeight[status] > statusWeight[worst] ? status : worst, "operational")

const measureService = async (id: StatusServiceId, url: string): Promise<StatusSample> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const startedAt = performance.now()

  try {
    const response = await fetch(url, { cache: "no-store", redirect: "follow", signal: controller.signal })
    const responseMs = Math.round(performance.now() - startedAt)

    return {
      serviceId: id,
      checkedAt: new Date().toISOString(),
      status: classifyResponse(response.ok, response.status, responseMs),
      responseMs,
      httpStatus: response.status,
      error: null,
    }
  } catch (error) {
    const responseMs = Math.round(performance.now() - startedAt)

    return {
      serviceId: id,
      checkedAt: new Date().toISOString(),
      status: "down",
      responseMs,
      httpStatus: null,
      error: error instanceof Error ? error.name : "FetchError",
    }
  } finally {
    clearTimeout(timeout)
  }
}

export const getStatusReport = async (): Promise<StatusReport> => {
  const reports = await Promise.all(services.map(async (svc) => {
    const samples = hasDatabase()
      ? await getPrisma().statusSample.findMany({
        where: { serviceId: svc.id },
        orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
        take: RECENT_SAMPLE_COUNT,
      }).then((rows) => rows.map((row): StatusSample => ({
        serviceId: row.serviceId as StatusServiceId,
        checkedAt: row.checkedAt.toISOString(),
        status: row.status as StatusSample["status"],
        responseMs: row.responseMs,
        httpStatus: row.httpStatus,
        error: row.error,
      })))
      : sampleStore.get(svc.id) ?? []

    return { id: svc.id, current: samples[0] ?? null, samples: samples.slice(0, RECENT_SAMPLE_COUNT) }
  }))

  return {
    generatedAt: new Date().toISOString(),
    checkIntervalHours: getCheckIntervalHours(),
    overallStatus: getWorstStatus(reports.map((s) => s.current?.status ?? "unknown")),
    services: reports,
  }
}

export const runStatusCheck = async (): Promise<StatusCheckResult> => {
  const samples = await Promise.all(
    services.map((svc) => measureService(svc.id, svc.url)),
  )

  if (hasDatabase()) {
    const prisma = getPrisma()
    await prisma.statusSample.createMany({
      data: samples.map((sample) => ({
        serviceId: sample.serviceId,
        checkedAt: new Date(sample.checkedAt),
        status: sample.status,
        responseMs: sample.responseMs,
        httpStatus: sample.httpStatus,
        error: sample.error,
      })),
    })

    const sampleLimit = getSampleLimit()
    await Promise.all(services.map(async (svc) => {
      const [oldestExcessSample] = await prisma.statusSample.findMany({
        where: { serviceId: svc.id },
        orderBy: [{ checkedAt: "desc" }, { id: "desc" }],
        skip: sampleLimit,
        take: 1,
        select: { id: true, checkedAt: true },
      })

      if (oldestExcessSample) {
        await prisma.statusSample.deleteMany({
          where: {
            serviceId: svc.id,
            OR: [
              { checkedAt: { lt: oldestExcessSample.checkedAt } },
              { checkedAt: oldestExcessSample.checkedAt, id: { lte: oldestExcessSample.id } },
            ],
          },
        })
      }
    }))
  } else {
    const sampleLimit = getSampleLimit()
    for (const sample of samples) {
      const existing = sampleStore.get(sample.serviceId) ?? []
      existing.unshift(sample)
      if (existing.length > sampleLimit) existing.length = sampleLimit
      sampleStore.set(sample.serviceId, existing)
    }
  }

  return {
    report: await getStatusReport(),
    skipped: false
  }
}
