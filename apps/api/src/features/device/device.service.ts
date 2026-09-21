import { getPrisma, hasDatabase } from "@/db/client"
import { cleanText } from "@nowly/shared"

type DeviceSyncPresence = {
  slug: string
  version?: string | null
  enabled?: boolean
  installed?: boolean
}

export type DeviceSyncInput = {
  deviceId: string
  extensionVersion?: string
  nativeVersion?: string
  browser?: string
  os?: string
  locale?: string
  presences?: DeviceSyncPresence[]
}

export const upsertDevice = async (input: DeviceSyncInput): Promise<void> => {
  if (!hasDatabase()) return

  const prisma = getPrisma()
  await prisma.device.upsert({
    where: { deviceId: input.deviceId },
    create: {
      deviceId: input.deviceId,
      extensionVersion: cleanText(input.extensionVersion),
      nativeVersion: cleanText(input.nativeVersion),
      browser: cleanText(input.browser, 60),
      os: cleanText(input.os, 60),
      locale: cleanText(input.locale, 20),
    },
    update: {
      extensionVersion: cleanText(input.extensionVersion),
      nativeVersion: cleanText(input.nativeVersion),
      browser: cleanText(input.browser, 60),
      os: cleanText(input.os, 60),
      locale: cleanText(input.locale, 20),
      lastSeenAt: new Date(),
    },
  })
}

export type DeviceExport = {
  device: {
    deviceId: string
    extensionVersion: string | null
    nativeVersion: string | null
    browser: string | null
    os: string | null
    locale: string | null
    firstSeenAt: string
    lastSeenAt: string
  } | null
  presences: Array<{ slug: string; installed: boolean; enabled: boolean; installedVersion: string | null }>
  analyticsEvents: Array<{ key: string; slug: string | null; source: string | null; country: string | null; createdAt: string }>
}

export const deviceExists = async (deviceId: string): Promise<boolean> => {
  if (!hasDatabase()) return false
  const device = await getPrisma().device.findUnique({ where: { deviceId }, select: { deviceId: true } })
  return device !== null
}

export const exportDeviceData = async (deviceId: string): Promise<DeviceExport | null> => {
  if (!hasDatabase()) return null

  const prisma = getPrisma()
  const [device, presences, analyticsEvents] = await Promise.all([
    prisma.device.findUnique({ where: { deviceId } }),
    prisma.devicePresence.findMany({ where: { deviceId } }),
    prisma.analyticsEvent.findMany({ where: { deviceId } }),
  ])

  if (!device) return null

  return {
    device: {
      deviceId: device.deviceId,
      extensionVersion: device.extensionVersion,
      nativeVersion: device.nativeVersion,
      browser: device.browser,
      os: device.os,
      locale: device.locale,
      firstSeenAt: device.firstSeenAt.toISOString(),
      lastSeenAt: device.lastSeenAt.toISOString(),
    },
    presences: presences.map((presence) => ({
      slug: presence.slug,
      installed: presence.installed,
      enabled: presence.enabled,
      installedVersion: presence.installedVersion,
    })),
    analyticsEvents: analyticsEvents.map((event) => ({
      key: event.key,
      slug: event.slug,
      source: event.source,
      country: event.country,
      createdAt: event.createdAt.toISOString(),
    })),
  }
}

export const deleteDeviceData = async (deviceId: string): Promise<void> => {
  if (!hasDatabase()) return

  const prisma = getPrisma()
  await prisma.$transaction([
    prisma.analyticsEvent.deleteMany({ where: { deviceId } }),
    prisma.devicePresence.deleteMany({ where: { deviceId } }),
    prisma.presenceActiveDevice.deleteMany({ where: { deviceId } }),
    prisma.presenceActiveSession.deleteMany({ where: { deviceId } }),
    prisma.device.deleteMany({ where: { deviceId } }),
  ])
}

export const syncDevice = async (input: DeviceSyncInput): Promise<void> => {
  await upsertDevice(input)
  if (!hasDatabase() || !input.presences?.length) return

  const prisma = getPrisma()
  for (const presence of input.presences) {
    const slug = cleanText(presence.slug, 80)?.toLowerCase()
    if (!slug) continue
    const installed = presence.installed !== false
    const enabled = installed && presence.enabled !== false
    const uninstalledAt = installed ? null : new Date()

    await prisma.devicePresence.upsert({
      where: { deviceId_slug: { deviceId: input.deviceId, slug } },
      create: {
        deviceId: input.deviceId,
        slug,
        installedVersion: cleanText(presence.version ?? undefined, 60),
        installed,
        enabled,
        uninstalledAt,
      },
      update: {
        installedVersion: cleanText(presence.version ?? undefined, 60),
        installed,
        enabled,
        updatedAt: new Date(),
        uninstalledAt,
      },
    })
  }
}
