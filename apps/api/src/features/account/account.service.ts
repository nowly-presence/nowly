import { getPrisma } from "@/db/client"
import { revokeDeviceExtensionTokens } from "./extension-token.service"

export const ACCOUNT_PROVIDERS = ["discord"] as const

export type AccountProfile = {
  id: string
  name: string
  image: string | null
  discordId: string | null
  githubLogin: string | null
}

export type AccountDevice = {
  deviceId: string
  browser: string | null
  os: string | null
  extensionVersion: string | null
  lastSeenAt: string
  current: boolean
}

export const getAccountProfile = async (userId: string): Promise<AccountProfile | null> => {
  const user = await getPrisma().user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true, discordId: true },
  })
  if (!user) return null
  return { id: user.id, name: user.name, image: user.image, discordId: user.discordId, githubLogin: null }
}

export const listAccountDevices = async (userId: string, currentDeviceId: string | null): Promise<AccountDevice[]> => {
  const devices = await getPrisma().device.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    select: { deviceId: true, browser: true, os: true, extensionVersion: true, lastSeenAt: true },
  })
  return devices.map((device) => ({
    deviceId: device.deviceId,
    browser: device.browser,
    os: device.os,
    extensionVersion: device.extensionVersion,
    lastSeenAt: device.lastSeenAt.toISOString(),
    current: device.deviceId === currentDeviceId,
  }))
}

export const unlinkAccountDevice = async (userId: string, deviceId: string): Promise<boolean> => {
  const result = await getPrisma().device.updateMany({ where: { userId, deviceId }, data: { userId: null } })
  await revokeDeviceExtensionTokens(userId, deviceId)
  return result.count > 0
}

export type AccountExport = {
  profile: AccountProfile & { email: string; createdAt: string }
  linkedAccounts: Array<{ providerId: string; accountId: string; createdAt: string }>
  devices: AccountDevice[]
  extensionTokens: Array<{ id: string; deviceId: string | null; scopes: string[]; createdAt: string; expiresAt: string; lastUsedAt: string | null; revokedAt: string | null }>
  syncDocuments: Array<{ key: string; value: unknown; version: number; updatedAt: string; updatedByDeviceId: string | null }>
  presenceLikes: Array<{ slug: string; deviceId: string; likedAt: string }>
}

const iso = (date: Date | null): string | null => date?.toISOString() ?? null

export const exportAccountData = async (userId: string): Promise<AccountExport | null> => {
  const prisma = getPrisma()
  const [user, accounts, tokens, documents, likes, devices] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.account.findMany({ where: { userId }, select: { providerId: true, accountId: true, createdAt: true } }),
    prisma.extensionToken.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.syncDocument.findMany({ where: { userId }, orderBy: { key: "asc" } }),
    prisma.presenceLike.findMany({ where: { userId }, orderBy: { likedAt: "asc" } }),
    listAccountDevices(userId, null),
  ])
  if (!user) return null

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      discordId: user.discordId,
      githubLogin: null,
      createdAt: user.createdAt.toISOString(),
    },
    linkedAccounts: accounts.map((account) => ({
      providerId: account.providerId,
      accountId: account.accountId,
      createdAt: account.createdAt.toISOString(),
    })),
    devices,
    extensionTokens: tokens.map((token) => ({
      id: token.id,
      deviceId: token.deviceId,
      scopes: token.scopes,
      createdAt: token.createdAt.toISOString(),
      expiresAt: token.expiresAt.toISOString(),
      lastUsedAt: iso(token.lastUsedAt),
      revokedAt: iso(token.revokedAt),
    })),
    syncDocuments: documents.map((document) => ({
      key: document.key,
      value: document.value,
      version: document.version,
      updatedAt: document.updatedAt.toISOString(),
      updatedByDeviceId: document.updatedByDeviceId,
    })),
    presenceLikes: likes.map((like) => ({ slug: like.slug, deviceId: like.deviceId, likedAt: like.likedAt.toISOString() })),
  }
}

export const deleteAccountData = async (userId: string): Promise<void> => {
  const prisma = getPrisma()
  await prisma.$transaction([
    prisma.device.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.presenceLike.updateMany({ where: { userId }, data: { userId: null } }),
    prisma.syncDocument.deleteMany({ where: { userId } }),
    prisma.extensionToken.deleteMany({ where: { userId } }),
    prisma.user.deleteMany({ where: { id: userId } }),
  ])
}
