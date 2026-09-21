import { requireAdmin } from "@/features/auth/require-admin"
import {
  createCampaign,
  listCampaigns,
  listSignups,
  recordSignup,
} from "@/features/campaigns/campaigns.service"
import type { FastifyInstance } from "fastify"

export const campaignsRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/", { preHandler: requireAdmin }, async () => ({ campaigns: await listCampaigns() }))

  fastify.post<{ Body: { name?: string } }>("/", { preHandler: requireAdmin }, async (request, reply) => {
    const name = request.body?.name?.trim()
    if (!name) return reply.status(400).send({ error: "NAME_REQUIRED" })
    return createCampaign(name)
  })

  fastify.get<{ Params: { id: string } }>(
    "/:id/signups",
    { preHandler: requireAdmin },
    async (request) => ({ signups: await listSignups(request.params.id) }),
  )

  // Public - this is the endpoint a signup form on the website or in the
  // extension posts to directly, no auth involved.
  fastify.post<{ Params: { id: string }; Body: { email?: string } }>(
    "/:id/signups",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const email = request.body?.email
      if (!email) return reply.status(400).send({ error: "EMAIL_REQUIRED" })
      const result = await recordSignup(request.params.id, email)
      if (!result.ok) return reply.status(400).send({ error: "INVALID_EMAIL_OR_CAMPAIGN" })
      return result
    },
  )
}
