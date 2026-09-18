import { requireAdmin } from "@/features/auth/require-admin"
import { parseCwsCsv, replaceCwsStats, type CwsStatRow } from "@/features/cws-stats/cws-stats.service"
import type { FastifyInstance } from "fastify"

type ImportBody = { files?: Array<{ name?: string; content?: string }> }

export const cwsStatsRoutes = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: ImportBody }>("/import", { preHandler: requireAdmin }, async (request, reply) => {
    const files = request.body?.files ?? []
    if (files.length === 0) return reply.status(400).send({ error: "No files provided" })

    const rows: CwsStatRow[] = []
    const skipped: string[] = []
    for (const file of files) {
      if (!file.content) continue
      const parsed = parseCwsCsv(file.content)
      if (parsed.length === 0) skipped.push(file.name ?? "unknown")
      rows.push(...parsed)
    }

    const result = await replaceCwsStats(rows)
    return { ...result, skipped }
  })
}
