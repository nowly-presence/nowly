import { extensionTokenBodySchema } from "@nowly/shared/schemas"
import type { FastifyInstance } from "fastify"
import {
  ACCOUNT_PROVIDERS,
  deleteAccountData,
  exportAccountData,
  getAccountProfile,
  listAccountDevices,
  unlinkAccountDevice,
} from "./account.service"
import { accountOf, requireExtensionToken, requireSession, requireTokenOrSession } from "./extension-token.middleware"
import { createExtensionToken, revokeExtensionToken } from "./extension-token.service"

const TOKEN_RATE_LIMIT = { max: 10, timeWindow: "1 minute" }

export const accountRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/extension/tokens",
    { preHandler: requireSession, config: { rateLimit: TOKEN_RATE_LIMIT } },
    async (request, reply) => {
      const parsed = extensionTokenBodySchema.safeParse(request.body ?? {})
      if (!parsed.success) return reply.status(400).send({ error: "INVALID_REQUEST_BODY" })

      const { userId } = accountOf(request)
      const user = await getAccountProfile(userId)
      if (!user) return reply.status(401).send({ error: "UNAUTHORIZED" })

      const { token, expiresAt } = await createExtensionToken({ userId, deviceId: parsed.data.deviceId, scopes: parsed.data.scopes })
      return { token, user, providers: [...ACCOUNT_PROVIDERS], expiresAt: expiresAt.getTime() }
    },
  )

  fastify.delete("/extension/tokens/current", { preHandler: requireExtensionToken("sync") }, async (request) => {
    const { tokenId } = accountOf(request)
    if (tokenId) await revokeExtensionToken(tokenId)
    return { ok: true }
  })

  fastify.get("/me", { preHandler: requireTokenOrSession }, async (request, reply) => {
    const user = await getAccountProfile(accountOf(request).userId)
    if (!user) return reply.status(401).send({ error: "UNAUTHORIZED" })
    return user
  })

  fastify.get("/me/devices", { preHandler: requireTokenOrSession }, async (request) => {
    const { userId, deviceId } = accountOf(request)
    return { devices: await listAccountDevices(userId, deviceId) }
  })

  fastify.delete<{ Params: { deviceId: string } }>("/me/devices/:deviceId", { preHandler: requireSession }, async (request, reply) => {
    const unlinked = await unlinkAccountDevice(accountOf(request).userId, request.params.deviceId.trim())
    if (!unlinked) return reply.status(404).send({ error: "DEVICE_NOT_FOUND" })
    return { ok: true }
  })

  fastify.get("/me/export", { preHandler: requireSession }, async (request, reply) => {
    const data = await exportAccountData(accountOf(request).userId)
    if (!data) return reply.status(404).send({ error: "ACCOUNT_NOT_FOUND" })
    return data
  })

  fastify.delete("/me", { preHandler: requireSession }, async (request) => {
    await deleteAccountData(accountOf(request).userId)
    return { ok: true }
  })
}
