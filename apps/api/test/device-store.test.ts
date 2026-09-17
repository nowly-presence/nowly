import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  device: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
  devicePresence: {
    upsert: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  presenceActiveDevice: {
    deleteMany: vi.fn(),
  },
  presenceActiveSession: {
    deleteMany: vi.fn(),
  },
  analyticsEvent: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn((operations: unknown[]) => Promise.all(operations)),
}))

vi.mock("@/db/client", () => ({
  hasDatabase: vi.fn(() => true),
  getPrisma: vi.fn(() => mockPrisma),
}))

describe("device-store", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.device.upsert.mockResolvedValue({})
    mockPrisma.devicePresence.upsert.mockResolvedValue({})
  })

  it("syncs an uninstall as installed false, enabled false, and uninstalledAt set", async () => {
    const { syncDevice } = await import("@/features/device/device.service")

    await syncDevice({
      deviceId: "device-1",
      presences: [{ slug: "YouTube", version: "1.2.3", enabled: true, installed: false }],
    })

    expect(mockPrisma.devicePresence.upsert).toHaveBeenCalledWith({
      where: { deviceId_slug: { deviceId: "device-1", slug: "youtube" } },
      create: expect.objectContaining({
        deviceId: "device-1",
        slug: "youtube",
        installedVersion: "1.2.3",
        installed: false,
        enabled: false,
        uninstalledAt: expect.any(Date),
      }),
      update: expect.objectContaining({
        installedVersion: "1.2.3",
        installed: false,
        enabled: false,
        uninstalledAt: expect.any(Date),
      }),
    })
  })
})

describe("exportDeviceData / deleteDeviceData", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns null when the device does not exist", async () => {
    const { exportDeviceData } = await import("@/features/device/device.service")
    mockPrisma.device.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.findMany.mockResolvedValue([])
    mockPrisma.analyticsEvent.findMany.mockResolvedValue([])

    expect(await exportDeviceData("device-1")).toBeNull()
  })

  it("exports the device row, its presences, and its analytics events", async () => {
    const { exportDeviceData } = await import("@/features/device/device.service")
    mockPrisma.device.findUnique.mockResolvedValue({
      deviceId: "device-1",
      extensionVersion: "1.0.0",
      nativeVersion: null,
      browser: "firefox",
      os: "windows",
      locale: "en-US",
      firstSeenAt: new Date("2026-01-01T00:00:00Z"),
      lastSeenAt: new Date("2026-01-02T00:00:00Z"),
    })
    mockPrisma.devicePresence.findMany.mockResolvedValue([
      { slug: "youtube", installed: true, enabled: true, installedVersion: "1.0.0" },
    ])
    mockPrisma.analyticsEvent.findMany.mockResolvedValue([
      { key: "presence_install", slug: "youtube", source: "web_library", country: "FR", createdAt: new Date("2026-01-01T00:00:00Z") },
    ])

    const result = await exportDeviceData("device-1")

    expect(result?.device?.browser).toBe("firefox")
    expect(result?.presences).toEqual([{ slug: "youtube", installed: true, enabled: true, installedVersion: "1.0.0" }])
    expect(result?.analyticsEvents).toEqual([
      { key: "presence_install", slug: "youtube", source: "web_library", country: "FR", createdAt: "2026-01-01T00:00:00.000Z" },
    ])
  })

  it("deletes every table scoped to the device", async () => {
    const { deleteDeviceData } = await import("@/features/device/device.service")

    await deleteDeviceData("device-1")

    expect(mockPrisma.analyticsEvent.deleteMany).toHaveBeenCalledWith({ where: { deviceId: "device-1" } })
    expect(mockPrisma.devicePresence.deleteMany).toHaveBeenCalledWith({ where: { deviceId: "device-1" } })
    expect(mockPrisma.presenceActiveDevice.deleteMany).toHaveBeenCalledWith({ where: { deviceId: "device-1" } })
    expect(mockPrisma.presenceActiveSession.deleteMany).toHaveBeenCalledWith({ where: { deviceId: "device-1" } })
    expect(mockPrisma.device.deleteMany).toHaveBeenCalledWith({ where: { deviceId: "device-1" } })
  })
})
