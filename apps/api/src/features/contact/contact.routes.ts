import {
  ContactEmailNotConfiguredError,
  contactMessageSchema,
  sendContactMessage,
} from "@/features/contact/contact.service"
import type { FastifyInstance } from "fastify"

export const contactRoutes = async (fastify: FastifyInstance): Promise<void> => {
  fastify.post(
    "/",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const parsed = contactMessageSchema.safeParse(request.body)
      if (!parsed.success) return reply.status(400).send({ error: "INVALID_CONTACT_FORM" })

      if (parsed.data.website) return { ok: true }

      try {
        await sendContactMessage(parsed.data)
        return { ok: true }
      } catch (error) {
        if (error instanceof ContactEmailNotConfiguredError) {
          return reply.status(503).send({ error: "CONTACT_SERVICE_UNAVAILABLE" })
        }

        request.log.error("contact email delivery failed")
        return reply.status(502).send({ error: "CONTACT_SERVICE_UNAVAILABLE" })
      }
    },
  )
}
