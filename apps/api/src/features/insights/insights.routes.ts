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
} from "@/features/insights/insights.service"
import { getFunnel } from "@nowly/analytics"
import type { FastifyInstance } from "fastify"

export const insightsRoutes = async (fastify: FastifyInstance) => {
  // Ingestion stays public - it's the extension reporting events, not an admin reading them.
  fastify.post("/events", async (request, reply) => {
    const parsed = parseIngestBody(request.body)
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" })
    const result = await recordInsightEvents(parsed.data.events)
    return { ok: true, ...result }
  })

  fastify.get<{ Querystring: { range?: string } }>(
    "/overview",
    { preHandler: requireAdmin },
    async (request) => {
      return getOverview(request.query.range)
    },
  )

  fastify.get<{ Querystring: { metric?: string; range?: string; granularity?: string } }>(
    "/series",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const metric = request.query.metric?.trim()
      if (!metric) return reply.status(400).send({ error: "metric is required" })
      const series = await getSeries(metric, request.query.range, request.query.granularity)
      if (!series) return reply.status(404).send({ error: "Metric not found" })
      return series
    },
  )

  fastify.get<{ Querystring: { range?: string } }>(
    "/funnels",
    { preHandler: requireAdmin },
    async (request) => {
      return { funnels: await listFunnelSummaries(request.query.range) }
    },
  )

  fastify.get<{ Params: { id: string }; Querystring: { range?: string } }>(
    "/funnels/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!getFunnel(request.params.id)) return reply.status(404).send({ error: "Funnel not found" })
      return getFunnelMeasurement(request.params.id, request.query.range)
    },
  )

  fastify.get("/catalog", { preHandler: requireAdmin }, async () => getCatalogPayload())

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
