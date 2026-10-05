import { getPrisma } from "@/db/client"
import { sha256Base64Url } from "@/shared/crypto.service"
import { EXTENSION_TOKEN_PREFIX, EXTENSION_TOKEN_SCOPES, EXTENSION_TOKEN_TTL_MS, type ExtensionTokenScope } from "@nowly/shared"
import { randomBytes, randomUUID } from "node:crypto"

const TOKEN_BYTES = 32
const TOUCH_INTERVAL_MS = 60 * 60 * 1000

export type ExtensionTokenRecord = {
  id: string
  userId: string
  deviceId: string | null
  scopes: ExtensionTokenScope[]
  expiresAt: Date
  lastUsedAt: Date | null
}

const isScope = (value: string): value is ExtensionTokenScope => (EXTENSION_TOKEN_SCOPES as readonly string[]).includes(value)

export const hashExtensionToken = (token: string): string => sha256Base64Url(token)

export const generateExtensionToken = (): string => `${EXTENSION_TOKEN_PREFIX}${randomBytes(TOKEN_BYTES).toString("base64url")}`

export const createExtensionToken = async (input: {
  userId: string
  deviceId?: string
  scopes: ExtensionTokenScope[]
  now?: Date
}): Promise<{ token: string; expiresAt: Date }> => {
  const prisma = getPrisma()
  const now = input.now ?? new Date()
  const token = generateExtensionToken()
  const expiresAt = new Date(now.getTime() + EXTENSION_TOKEN_TTL_MS)

  if (input.deviceId) {
    await prisma.extensionToken.updateMany({
      where: { userId: input.userId, deviceId: input.deviceId, revokedAt: null },
      data: { revokedAt: now },
    })
  }

  await prisma.extensionToken.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      deviceId: input.deviceId ?? null,
      tokenHash: hashExtensionToken(token),
      scopes: [...new Set(input.scopes)],
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export const findActiveExtensionToken = async (token: string, now = new Date()): Promise<ExtensionTokenRecord | null> => {
  if (!token.startsWith(EXTENSION_TOKEN_PREFIX)) return null
  const row = await getPrisma().extensionToken.findUnique({ where: { tokenHash: hashExtensionToken(token) } })
  if (!row || row.revokedAt || row.expiresAt.getTime() <= now.getTime()) return null
  return {
    id: row.id,
    userId: row.userId,
    deviceId: row.deviceId,
    scopes: row.scopes.filter(isScope),
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
  }
}

export const touchExtensionToken = async (record: ExtensionTokenRecord, now = new Date()): Promise<void> => {
  if (record.lastUsedAt && now.getTime() - record.lastUsedAt.getTime() < TOUCH_INTERVAL_MS) return
  await getPrisma().extensionToken.update({
    where: { id: record.id },
    data: { lastUsedAt: now, expiresAt: new Date(now.getTime() + EXTENSION_TOKEN_TTL_MS) },
  })
}

export const revokeExtensionToken = async (id: string, now = new Date()): Promise<void> => {
  await getPrisma().extensionToken.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: now } })
}

export const revokeDeviceExtensionTokens = async (userId: string, deviceId: string, now = new Date()): Promise<void> => {
  await getPrisma().extensionToken.updateMany({ where: { userId, deviceId, revokedAt: null }, data: { revokedAt: now } })
}

export const revokeUserExtensionTokens = async (userId: string, now = new Date()): Promise<number> => {
  const result = await getPrisma().extensionToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } })
  return result.count
}

export const attachTokenToDevice = async (id: string, deviceId: string): Promise<void> => {
  await getPrisma().extensionToken.update({ where: { id }, data: { deviceId } })
}
