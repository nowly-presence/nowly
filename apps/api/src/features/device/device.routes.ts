import { deviceSyncBodySchema } from "@nowly/shared/schemas"
import type { FastifyInstance } from "fastify"
import { deviceRateLimitKey } from "@/shared/rate-limit"
import { deriveDeviceToken, requireDeviceAccess } from "./device-token"
import { deleteDeviceData, exportDeviceData, syncDevice } from "./device.service"

export const deviceRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/sync",
    {
      config: {
        // Every call here can mint a fresh, valid device token - keep this tighter
        // than the global limit so spamming new deviceIds is slow to pay off.
        // Keyed by deviceId (not IP) so a shared NAT with several real users
        // doesn't get capped as if it were one client.
        rateLimit: { max: 20, timeWindow: "1 minute", hook: "preHandler", keyGenerator: deviceRateLimitKey },
      },
    },
    async (request, reply) => {
      const parsed = deviceSyncBodySchema.safeParse(request.body)
      if (!parsed.success) return reply.status(400).send({ error: "INVALID_REQUEST_BODY" })

      await syncDevice(parsed.data)
      return { ok: true, deviceToken: deriveDeviceToken(parsed.data.deviceId) }
    },
  )

  // Right to access: everything Nowly has stored for this device.
  fastify.get<{ Params: { deviceId: string }; Querystring: { token?: string } }>(
    "/:deviceId/export",
    async (request, reply) => {
      const deviceId = request.params.deviceId.trim()
      if (!requireDeviceAccess(request, reply, deviceId)) return

      const data = await exportDeviceData(deviceId)
      if (!data) return reply.status(404).send({ error: "DEVICE_NOT_FOUND" })
      return data
    },
  )

  // Right to erasure: wipes the device row, its presences, sessions, and analytics events.
  fastify.delete<{ Params: { deviceId: string }; Querystring: { token?: string } }>(
    "/:deviceId",
    async (request, reply) => {
      const deviceId = request.params.deviceId.trim()
      if (!requireDeviceAccess(request, reply, deviceId)) return

      await deleteDeviceData(deviceId)
      return { ok: true }
    },
  )
}
