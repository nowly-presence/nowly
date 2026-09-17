import { clearActiveDevicesForDevice } from "@/features/presence/presence.service"
import { deviceSyncBodySchema } from "@nowly/shared/schemas"
import type { FastifyInstance } from "fastify"
import { deriveDeviceToken, requireDeviceAccess } from "./device-token"
import { syncDevice } from "./device.service"

export const deviceRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/sync", async (request, reply) => {
    const parsed = deviceSyncBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: "Invalid request body" })

    await syncDevice(parsed.data)
    return { ok: true, deviceToken: deriveDeviceToken(parsed.data.deviceId) }
  })

  fastify.delete<{ Params: { deviceId: string }; Querystring: { token?: string } }>("/:deviceId", async (request, reply) => {
    const deviceId = request.params.deviceId.trim()
    if (!requireDeviceAccess(request, reply, deviceId)) return

    await clearActiveDevicesForDevice(deviceId)
    return { ok: true }
  })
}
