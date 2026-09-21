import { getAuth } from "@/features/auth/better-auth"
import { fromNodeHeaders } from "better-auth/node"
import type { FastifyReply, FastifyRequest } from "fastify"

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const session = await getAuth().api.getSession({ headers: fromNodeHeaders(request.headers) })

  if (!session || session.user.role !== "admin") {
    reply.status(401).send({ error: "ADMIN_AUTH_REQUIRED" })
  }
}
