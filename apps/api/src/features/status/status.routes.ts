import { getStatusReport, runStatusCheck } from "./status.service"
import { serverEnv } from "@nowly/env/server"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

const requireCronAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const secret = serverEnv.STATUS_CRON_SECRET

  if (!secret && process.env.NODE_ENV === "production") {
    reply.status(500).send({ error: "STATUS_CRON_SECRET_MISSING" })
    return
  }

  if (!secret) return

  const auth = request.headers.authorization
  if (!auth || auth !== `Bearer ${secret}`) {
    reply.status(401).send({ error: "UNAUTHORIZED" })
  }
}

export const statusRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/status", async () => {
    return getStatusReport()
  })

  app.post("/status/check", { preHandler: requireCronAuth }, async () => {
    const result = await runStatusCheck()

    return result
  })

  app.get("/status/check", { preHandler: requireCronAuth }, async () => {
    const result = await runStatusCheck()

    return result
  })
}
