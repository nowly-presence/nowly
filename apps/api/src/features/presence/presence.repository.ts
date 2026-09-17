import { getPrisma } from "@/db/client"
import type { GlobalPresenceStats, PresenceMeta, PresenceStats, VersionEntry } from "./presence.types"

const ACTIVE_DEVICE_STALE_MS = 12 * 60 * 1000

const iso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export const markActiveDevice = async (slug: string, deviceId: string, timestamp = Date.now()): Promise<void> => {
  const prisma = getPrisma()
  await prisma.presenceActiveDevice.upsert({
    where: { slug_deviceId: { slug, deviceId } },
    create: { slug, deviceId, lastSeenAt: new Date(timestamp) },
    update: { lastSeenAt: new Date(timestamp) },
  })
}

export const clearActiveDevice = async (slug: string, deviceId: string): Promise<void> => {
  await getPrisma().presenceActiveDevice.deleteMany({ where: { slug, deviceId } })
}

export const clearActiveDevicesForDevice = async (deviceId: string): Promise<void> => {
  await getPrisma().presenceActiveDevice.deleteMany({ where: { deviceId } })
}

export const getActiveUsers = async (slug: string): Promise<number> => {
  const prisma = getPrisma()
  await prisma.presenceActiveDevice.deleteMany({
    where: { slug, lastSeenAt: { lt: new Date(Date.now() - ACTIVE_DEVICE_STALE_MS) } },
  })
  return prisma.presenceActiveDevice.count({ where: { slug } })
}

export const getGlobalPresenceStats = async (): Promise<GlobalPresenceStats> => {
  const prisma = getPrisma()

  await prisma.presenceActiveDevice.deleteMany({
    where: { lastSeenAt: { lt: new Date(Date.now() - ACTIVE_DEVICE_STALE_MS) } },
  })

  const [totalUsers, activeUsers, activePresenceCount, installedPresenceCount] = await Promise.all([
    prisma.device.count(),
    prisma.presenceActiveDevice.groupBy({ by: ["deviceId"] }),
    prisma.presenceActiveDevice.count(),
    prisma.devicePresence.count({ where: { installed: true } }),
  ])

  return {
    totalUsers,
    activeUsers: activeUsers.length,
    activePresenceCount,
    installedPresenceCount,
  }
}

export const getPresenceStats = async (slug: string): Promise<PresenceStats> => {
  const prisma = getPrisma()
  const presence = await prisma.presence.findUnique({ where: { slug } })
  const totalInstalls = await prisma.devicePresence.count({ where: { slug, installed: true } })

  return {
    totalInstalls,
    activeUsers: await getActiveUsers(slug),
    likes: await getLikeCount(slug),
    version: presence?.version ?? null,
    archived: presence?.archived ?? false,
    addedAt: iso(presence?.addedAt),
    lastUpdated: iso(presence?.updatedAt),
  }
}

export const likePresence = async (slug: string, deviceId: string): Promise<void> => {
  await getPrisma().presenceLike.upsert({
    where: { slug_deviceId: { slug, deviceId } },
    create: { slug, deviceId },
    update: {},
  })
}

export const unlikePresence = async (slug: string, deviceId: string): Promise<void> => {
  await getPrisma().presenceLike.deleteMany({ where: { slug, deviceId } })
}

export const hasLikedPresence = async (slug: string, deviceId: string): Promise<boolean> => {
  const like = await getPrisma().presenceLike.findUnique({ where: { slug_deviceId: { slug, deviceId } } })
  return like !== null
}

export const getLikeCount = async (slug: string): Promise<number> => {
  return getPrisma().presenceLike.count({ where: { slug } })
}

export const incrementInstalls = async (slug: string, deviceId?: string, version?: string): Promise<number> => {
  const resolvedDeviceId = deviceId?.trim() || `anonymous-install-${crypto.randomUUID()}`
  const prisma = getPrisma()
  await prisma.device.upsert({
    where: { deviceId: resolvedDeviceId },
    create: { deviceId: resolvedDeviceId },
    update: { lastSeenAt: new Date() },
  })
  await prisma.devicePresence.upsert({
    where: { deviceId_slug: { deviceId: resolvedDeviceId, slug } },
    create: { deviceId: resolvedDeviceId, slug, installedVersion: version, installed: true, enabled: true },
    update: { installedVersion: version, installed: true, enabled: true, updatedAt: new Date(), uninstalledAt: null },
  })
  return prisma.devicePresence.count({ where: { slug, installed: true } })
}

export const setActiveUsers = async (_slug: string, _count: number): Promise<void> => {
  return
}

export const setUpdated = async (slug: string, date?: string): Promise<void> => {
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, updatedAt: date ? new Date(date) : new Date() },
    update: { updatedAt: date ? new Date(date) : new Date() },
  })
}

export const setAdded = async (slug: string, date?: string): Promise<void> => {
  const value = date ? new Date(date) : new Date()
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, addedAt: value },
    update: { addedAt: value },
  })
}

export const setVersion = async (slug: string, version: string): Promise<void> => {
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, version, updatedAt: new Date() },
    update: { version, updatedAt: new Date() },
  })
}

export const getVersion = async (slug: string): Promise<string | null> => {
  return (await getPrisma().presence.findUnique({ where: { slug }, select: { version: true } }))?.version ?? null
}

export const addVersion = async (slug: string, entry: VersionEntry): Promise<void> => {
  const prisma = getPrisma()
  await prisma.presence.upsert({
    where: { slug },
    create: { slug, version: entry.version },
    update: {},
  })
  await prisma.presenceVersion.upsert({
    where: { slug_version: { slug, version: entry.version } },
    create: {
      slug,
      version: entry.version,
      changelog: entry.changelog,
      author: entry.author,
      authorGithub: entry.authorGithub,
      releaseAuthor: entry.releaseAuthor,
      releaseContributors: entry.releaseContributors,
      pr: entry.pr,
      source: entry.source,
      commitSha: entry.commitSha,
      changedFiles: entry.changedFiles,
      bundleSizeBytes: entry.bundleSizeBytes,
      bundleSizeLabel: entry.bundleSizeLabel,
      bundleSha256: entry.bundleSha256,
      versionType: entry.versionType,
      aiGeneratedChangelog: entry.aiGeneratedChangelog,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.timestamp),
      timestamp: new Date(entry.timestamp),
    },
    update: {
      changelog: entry.changelog,
      author: entry.author,
      authorGithub: entry.authorGithub,
      releaseAuthor: entry.releaseAuthor,
      releaseContributors: entry.releaseContributors,
      pr: entry.pr,
      source: entry.source,
      commitSha: entry.commitSha,
      changedFiles: entry.changedFiles,
      bundleSizeBytes: entry.bundleSizeBytes,
      bundleSizeLabel: entry.bundleSizeLabel,
      bundleSha256: entry.bundleSha256,
      versionType: entry.versionType,
      aiGeneratedChangelog: entry.aiGeneratedChangelog,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.timestamp),
      timestamp: new Date(entry.timestamp),
    },
  })
}

export const setPresenceMeta = async (slug: string, meta: PresenceMeta): Promise<void> => {
  await getPrisma().presence.upsert({
    where: { slug },
    create: { slug, metadata: meta },
    update: { metadata: meta },
  })
}

export const getPresenceMeta = async (slug: string): Promise<PresenceMeta | null> => {
  const row = await getPrisma().presence.findUnique({ where: { slug }, select: { metadata: true } })
  return (row?.metadata as PresenceMeta | null) ?? null
}

export const getAllPresenceSlugs = async (options: { includeArchived?: boolean } = {}): Promise<string[]> => {
  const rows = await getPrisma().presence.findMany({
    where: options.includeArchived ? undefined : { archived: false },
    select: { slug: true },
    orderBy: { slug: "asc" },
  })
  return rows.map((row) => row.slug)
}

export const setArchived = async (slug: string, archived: boolean): Promise<boolean> => {
  const result = await getPrisma().presence.updateMany({
    where: { slug, archived: { not: archived } },
    data: { archived },
  })
  return result.count > 0
}

export const getVersionHistory = async (slug: string): Promise<VersionEntry[]> => {
  const rows = await getPrisma().presenceVersion.findMany({
    where: { slug },
    orderBy: { timestamp: "desc" },
  })
  return rows.map((row) => ({
    version: row.version,
    changelog: row.changelog,
    author: row.author,
    authorGithub: row.authorGithub ?? undefined,
    releaseAuthor: row.releaseAuthor ?? undefined,
    releaseContributors: row.releaseContributors ?? undefined,
    pr: row.pr ?? undefined,
    source: row.source === "cli" || row.source === "pr" ? row.source : undefined,
    commitSha: row.commitSha ?? undefined,
    changedFiles: row.changedFiles ?? undefined,
    bundleSizeBytes: row.bundleSizeBytes ?? undefined,
    bundleSizeLabel: row.bundleSizeLabel ?? undefined,
    bundleSha256: row.bundleSha256 ?? undefined,
    versionType: row.versionType ?? undefined,
    aiGeneratedChangelog: row.aiGeneratedChangelog ?? undefined,
    createdAt: row.createdAt.toISOString(),
    timestamp: row.timestamp.getTime(),
  }))
}