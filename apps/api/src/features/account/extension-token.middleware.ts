import { hasDatabase } from "@/db/client"
import { getAuth } from "@/features/auth/better-auth"
import type { ExtensionTokenScope } from "@nowly/shared"
import { fromNodeHeaders } from "better-auth/node"
import type { FastifyReply, FastifyRequest } from "fastify"
import { findActiveExtensionToken, touchExtensionToken } from "./extension-token.service"

export type AccountContext = {
  userId: string
  deviceId: string | null
  scopes: ExtensionTokenScope[]
  tokenId: string | null
}

declare module "fastify" {
  interface FastifyRequest {
    account?: AccountContext
  }
}

const BEARER_PREFIX = "Bearer "

const bearerToken = (request: FastifyRequest): string | null => {
  const header = request.headers.authorization
  if (!header?.startsWith(BEARER_PREFIX)) return null
  const token = header.slice(BEARER_PREFIX.length).trim()
  return token || null
}

const resolveTokenAccount = async (request: FastifyRequest): Promise<AccountContext | null> => {
  const token = bearerToken(request)
  if (!token) return null
  const record = await findActiveExtensionToken(token)
  if (!record) return null
  await touchExtensionToken(record).catch(() => undefined)
  return { userId: record.userId, deviceId: record.deviceId, scopes: record.scopes, tokenId: record.id }
}

export const getSessionUserId = async (request: FastifyRequest): Promise<string | null> => {
  try {
    const session = await getAuth().api.getSession({ headers: fromNodeHeaders(request.headers) })
    return session?.user.id ?? null
  } catch {
    return null
  }
}

const rejectWithoutDatabase = (reply: FastifyReply): boolean => {
  if (hasDatabase()) return false
  reply.status(503).send({ error: "DATABASE_UNAVAILABLE" })
  return true
}

export const requireExtensionToken = (scope: ExtensionTokenScope) =>
  async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (rejectWithoutDatabase(reply)) return
    const account = await resolveTokenAccount(request)
    if (!account || !account.scopes.includes(scope)) {
      reply.status(401).send({ error: "UNAUTHORIZED" })
      return
    }
    request.account = account
  }

export const requireSession = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (rejectWithoutDatabase(reply)) return
  const userId = await getSessionUserId(request)
  if (!userId) {
    reply.status(401).send({ error: "UNAUTHORIZED" })
    return
  }
  request.account = { userId, deviceId: null, scopes: [], tokenId: null }
}

export const requireTokenOrSession = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  if (rejectWithoutDatabase(reply)) return
  const account = bearerToken(request) ? await resolveTokenAccount(request) : null
  if (account) {
    request.account = account
    return
  }
  await requireSession(request, reply)
}

export const accountOf = (request: FastifyRequest): AccountContext => {
  if (!request.account) throw new Error("account guard missing on this route")
  return request.account
}
