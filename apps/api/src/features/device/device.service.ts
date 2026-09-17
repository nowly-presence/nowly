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
