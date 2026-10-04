import { accountOf, requireExtensionToken } from "@/features/account/extension-token.middleware"
import { revokeUserExtensionTokens } from "@/features/account/extension-token.service"
import { isSyncDocumentKey } from "@nowly/shared"
import { syncChangesQuerySchema, syncPutBodySchema } from "@nowly/shared/schemas"
import type { FastifyInstance } from "fastify"
import { deleteSyncDocuments, listSyncDocuments, putSyncDocument, validateSyncValue } from "./sync.service"

export const syncRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", requireExtensionToken("sync"))

  fastify.get("/", async (request) => {
    const serverTime = new Date().toISOString()
    return { documents: await listSyncDocuments(accountOf(request).userId), serverTime }
  })

  fastify.get("/changes", async (request, reply) => {
    const parsed = syncChangesQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.status(400).send({ error: "INVALID_SINCE" })
    const serverTime = new Date().toISOString()
    return { documents: await listSyncDocuments(accountOf(request).userId, new Date(parsed.data.since)), serverTime }
  })

  fastify.put<{ Params: { key: string } }>("/:key", async (request, reply) => {
    const { key } = request.params
    if (!isSyncDocumentKey(key)) return reply.status(404).send({ error: "UNKNOWN_SYNC_KEY" })

    const parsed = syncPutBodySchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: "INVALID_REQUEST_BODY" })

    const validation = validateSyncValue(key, parsed.data.value)
    if (!validation.ok) return reply.status(validation.status).send({ error: validation.error })

    const account = accountOf(request)
    const result = await putSyncDocument({
      userId: account.userId,
      key,
      value: validation.value,
      baseVersion: parsed.data.baseVersion,
      deviceId: account.deviceId,
    })
    if (result.ok) return { version: result.version, updatedAt: result.updatedAt }

    return reply.status(409).send({
      error: "VERSION_CONFLICT",
      value: result.current?.value ?? null,
      version: result.current?.version ?? 0,
      updatedAt: result.current?.updatedAt ?? null,
    })
  })

  fastify.delete("/", async (request) => {
    const { userId } = accountOf(request)
    const deleted = await deleteSyncDocuments(userId)
    await revokeUserExtensionTokens(userId)
    return { ok: true, deleted }
  })
}
