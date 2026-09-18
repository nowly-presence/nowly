import { getPrisma } from "@/db/client"
import { ANALYTICS_SOURCES } from "@nowly/analytics"

const FAKE_DEVICE_PREFIX = "fake-"

const BROWSERS = ["chrome", "firefox", "edge"]
const OSES = ["windows", "macos", "linux"]
const LOCALES = ["en-US", "fr-FR", "es-ES"]
const COUNTRIES = ["FR", "US", "DE", "GB", "ES", "CA"]
const SLUGS = ["youtube", "netflix", "spotify", "twitch", "figma"]
const EXTENSION_VERSIONS = ["1.4.0", "1.5.0", "2.0.0"]

// Metric key -> which dimensions to fill in on each fake event.
const SEED_METRICS: Array<{ key: string; withSlug?: boolean; withSource?: boolean; dailyRange: [number, number] }> = [
  { key: "extension_install", withSource: true, dailyRange: [2, 8] },
  { key: "extension_open", dailyRange: [30, 80] },
  { key: "onboarding_completed", withSource: true, dailyRange: [2, 6] },
  { key: "presence_install", withSlug: true, withSource: true, dailyRange: [10, 30] },
  { key: "presence_active_heartbeat", withSlug: true, withSource: true, dailyRange: [80, 200] },
  { key: "presence_session_start", withSlug: true, dailyRange: [40, 100] },
  { key: "presence_uninstall", withSlug: true, withSource: true, dailyRange: [1, 6] },
  { key: "presence_error", withSlug: true, dailyRange: [0, 5] },
  { key: "marketplace_page_view", withSlug: true, withSource: true, dailyRange: [20, 60] },
  { key: "marketplace_install_click", withSlug: true, withSource: true, dailyRange: [5, 20] },
  { key: "native_connected", dailyRange: [15, 40] },
  { key: "native_heartbeat_ok", dailyRange: [100, 300] },
]

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T>(items: readonly T[]): T => items[randomInt(0, items.length - 1)]!

const buildFakeDevices = (count: number) =>
  Array.from({ length: count }, () => ({
    deviceId: `${FAKE_DEVICE_PREFIX}${crypto.randomUUID()}`,
    browser: pick(BROWSERS),
    os: pick(OSES),
    locale: pick(LOCALES),
    extensionVersion: pick(EXTENSION_VERSIONS),
  }))

export const seedFakeAnalytics = async (days = 10): Promise<{ devices: number; events: number }> => {
  const prisma = getPrisma()
  const devices = buildFakeDevices(12)

  await prisma.device.createMany({
    data: devices.map((device) => ({
      deviceId: device.deviceId,
      browser: device.browser,
      os: device.os,
      locale: device.locale,
      extensionVersion: device.extensionVersion,
    })),
    skipDuplicates: true,
  })

  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  const events: Array<{
    eventId: string
    key: string
    deviceId: string
    slug: string | null
    source: string | null
    country: string | null
    payload: object
    createdAt: Date
  }> = []

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset--) {
    const dayStart = now - dayOffset * dayMs
    for (const metric of SEED_METRICS) {
      const count = randomInt(metric.dailyRange[0], metric.dailyRange[1])
      for (let i = 0; i < count; i++) {
        const device = pick(devices)
        events.push({
          eventId: crypto.randomUUID(),
          key: metric.key,
          deviceId: device.deviceId,
          slug: metric.withSlug ? pick(SLUGS) : null,
          source: metric.withSource ? pick(ANALYTICS_SOURCES) : null,
          country: pick(COUNTRIES),
          payload: {},
          createdAt: new Date(dayStart + Math.random() * dayMs),
        })
      }
    }
  }

  await prisma.analyticsEvent.createMany({ data: events, skipDuplicates: true })

  return { devices: devices.length, events: events.length }
}

export const clearFakeAnalytics = async (): Promise<{ devices: number; events: number }> => {
  const prisma = getPrisma()
  const events = await prisma.analyticsEvent.deleteMany({ where: { deviceId: { startsWith: FAKE_DEVICE_PREFIX } } })
  const devices = await prisma.device.deleteMany({ where: { deviceId: { startsWith: FAKE_DEVICE_PREFIX } } })
  return { devices: devices.count, events: events.count }
}
