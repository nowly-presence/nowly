import { getAuth } from "@/features/auth/better-auth"
import { requireAdmin } from "@/features/auth/require-admin"
import {
  getCatalogPayload,
  getFunnelMeasurement,
  getLiveSnapshot,
  getOverview,
  getSeries,
  listFunnelSummaries,
  parseIngestBody,
  recordInsightEvents,
  type InsightsFilters,
  type InsightsWindow,
} from "@/features/insights/insights.service"
import { clearFakeAnalytics, seedFakeAnalytics } from "@/features/insights/insights-dev-seed.service"
import { createView, deleteView, getView, listViews, updateView } from "@/features/insights/insights-views.service"
import { getFunnel, type WidgetConfig } from "@nowly/analytics"
import { fromNodeHeaders } from "better-auth/node"
import type { FastifyInstance, FastifyRequest } from "fastify"

type FilterQuery = {
  slug?: string
  source?: string
  country?: string
  browser?: string
  os?: string
  locale?: string
}

// Never trust a client-supplied country - only Cloudflare's own edge-derived header counts.
const countryFromRequest = (request: FastifyRequest): string | undefined => {
  const header = request.headers["cf-ipcountry"]
  const value = Array.isArray(header) ? header[0] : header
  return value && value !== "XX" ? value : undefined
}

const filtersFromQuery = (query: FilterQuery): InsightsFilters => ({
  slug: query.slug?.trim() || undefined,
  source: query.source?.trim() || undefined,
  country: query.country?.trim() || undefined,
  browser: query.browser?.trim() || undefined,
  os: query.os?.trim() || undefined,
  locale: query.locale?.trim() || undefined,
})

type WindowQuery = { range?: string; from?: string; to?: string }

const windowFromQuery = (query: WindowQuery): InsightsWindow => ({
  range: query.range,
  from: query.from,
  to: query.to,
})

export const insightsRoutes = async (fastify: FastifyInstance) => {
  // Ingestion stays public - it's the extension reporting events, not an admin reading them.
  fastify.post("/events", async (request, reply) => {
    const parsed = parseIngestBody(request.body)
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" })
    const result = await recordInsightEvents(parsed.data.events, countryFromRequest(request))
    return { ok: true, ...result }
  })

  fastify.get<{ Querystring: WindowQuery & FilterQuery }>(
    "/overview",
    { preHandler: requireAdmin },
    async (request) => {
      return getOverview(windowFromQuery(request.query), filtersFromQuery(request.query))
    },
  )

  fastify.get<{ Querystring: { metric?: string; granularity?: string; compare?: string } & WindowQuery & FilterQuery }>(
    "/series",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const metric = request.query.metric?.trim()
      if (!metric) return reply.status(400).send({ error: "metric is required" })
      const compare = request.query.compare === "true"
      const series = await getSeries(metric, windowFromQuery(request.query), request.query.granularity, filtersFromQuery(request.query), compare)
      if (!series) return reply.status(404).send({ error: "Metric not found" })
      return series
    },
  )

  fastify.get<{ Querystring: WindowQuery & FilterQuery }>(
    "/funnels",
    { preHandler: requireAdmin },
    async (request) => {
      return { funnels: await listFunnelSummaries(windowFromQuery(request.query), filtersFromQuery(request.query)) }
    },
  )

  fastify.get<{ Params: { id: string }; Querystring: WindowQuery & FilterQuery }>(
    "/funnels/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!getFunnel(request.params.id)) return reply.status(404).send({ error: "Funnel not found" })
      return getFunnelMeasurement(request.params.id, windowFromQuery(request.query), filtersFromQuery(request.query))
    },
  )

  fastify.get("/catalog", { preHandler: requireAdmin }, async () => getCatalogPayload())

  fastify.get("/views", { preHandler: requireAdmin }, async () => ({ views: await listViews() }))

  fastify.post<{ Body: { name: string; widgets: WidgetConfig[] } }>(
    "/views",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const session = await getAuth().api.getSession({ headers: fromNodeHeaders(request.headers) })
      if (!session) return reply.status(401).send({ error: "Admin authentication required" })
      return createView(session.user.id, request.body.name, request.body.widgets)
    },
  )

  fastify.get<{ Params: { id: string } }>("/views/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const view = await getView(request.params.id)
    if (!view) return reply.status(404).send({ error: "View not found" })
    return view
  })

  fastify.patch<{ Params: { id: string }; Body: { name: string; widgets: WidgetConfig[] } }>(
    "/views/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { count } = await updateView(request.params.id, request.body.name, request.body.widgets)
      if (!count) return reply.status(404).send({ error: "View not found" })
      return { ok: true }
    },
  )

  fastify.delete<{ Params: { id: string } }>("/views/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { count } = await deleteView(request.params.id)
    if (!count) return reply.status(404).send({ error: "View not found" })
    return { ok: true }
  })

  // Dev-only helpers to fill/clear synthetic analytics data for local testing.
  // Refuses to run against a real production deployment regardless of caller.
  fastify.post<{ Body: { days?: number } }>(
    "/dev/seed",
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (process.env.NODE_ENV === "production") return reply.status(403).send({ error: "Not available in production" })
      return seedFakeAnalytics(request.body?.days)
    },
  )

  fastify.post(
    "/dev/clear",
    { preHandler: requireAdmin },
    async (_request, reply) => {
      if (process.env.NODE_ENV === "production") return reply.status(403).send({ error: "Not available in production" })
      return clearFakeAnalytics()
    },
  )

  fastify.get("/live", { config: { rateLimit: false }, preHandler: requireAdmin }, async (request, reply) => {
    reply.hijack()
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": request.headers.origin ?? "*",
    })

    const tick = () => {
      reply.raw.write(`data: ${JSON.stringify(getLiveSnapshot())}\n\n`)
    }
    tick()
    const timer = setInterval(tick, 1000)
    const close = () => {
      clearInterval(timer)
      reply.raw.end()
    }
    request.raw.on("close", close)
    request.raw.on("aborted", close)
  })
}
