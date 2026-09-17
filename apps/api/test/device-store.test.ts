import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  device: {
    upsert: vi.fn(),
  },
  devicePresence: {
    upsert: vi.fn(),
  },
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
