import { serverEnv } from "@nowly/env/server"
import type { FastifyReply, FastifyRequest } from "fastify"

export const hasAdminAuth = (request: FastifyRequest): boolean => {
  const secret = serverEnv.API_SECRET_KEY ?? process.env.API_SECRET_KEY
  if (!secret) return false
  return request.headers.authorization === `Bearer ${secret}`
}

// Same fail-closed-in-production pattern as status.routes.ts's requireCronAuth:
// a misconfigured/missing secret must not silently grant admin access.
export const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const secret = serverEnv.API_SECRET_KEY ?? process.env.API_SECRET_KEY

  if (!secret && process.env.NODE_ENV === "production") {
    reply.status(500).send({ error: "Missing API_SECRET_KEY" })
    return
  }

  if (!secret) return

  if (request.headers.authorization !== `Bearer ${secret}`) {
    reply.status(401).send({ error: "Unauthorized" })
  }
}
