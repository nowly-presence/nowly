import { serverEnv } from "@nowly/env/server"
import type { FastifyReply, FastifyRequest } from "fastify"

export const hasAdminAuth = (request: FastifyRequest): boolean => {
  const secret = serverEnv.API_SECRET_KEY ?? process.env.API_SECRET_KEY
  if (!secret) return true
  return request.headers.authorization === `Bearer ${secret}`
}

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (hasAdminAuth(request)) return
  reply.status(401).send({ error: "Unauthorized" })
}
