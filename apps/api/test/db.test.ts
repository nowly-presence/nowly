import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  presence: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  presenceVersion: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  device: {
    upsert: vi.fn(),
  },
  devicePresence: {
    upsert: vi.fn(),
    count: vi.fn(),
  },
  presenceActiveDevice: {
    upsert: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
  supporterPass: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  supporterDevice: {
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  donationEvent: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}))

vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => mockPrisma),
  hasDatabase: vi.fn(() => true),
}))

import {
  getPresenceStats,
  incrementInstalls,
  setActiveUsers,
  markActiveDevice,
  clearActiveDevice,
  clearActiveDevicesForDevice,
  setUpdated,
  setAdded,
  setVersion,
  getVersion,
  addVersion,
  setPresenceMeta,
  getPresenceMeta,
  getAllPresenceSlugs,
  getVersionHistory,
  setArchived,
} from "@/features/presence/presence.repository"

import {
  createSupporterPass,
  hasAdFreeAccess,
  redeemSupporterCodeForDevice,
  recordDonationAndCreatePass,
} from "@/features/support/support.repository"

describe("getPresenceStats", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("returns defaults when no data", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.count.mockResolvedValue(0)
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(0)

    const stats = await getPresenceStats("youtube")
    expect(stats.totalInstalls).toBe(0)
    expect(stats.activeUsers).toBe(0)
    expect(stats.version).toBeNull()
    expect(stats.archived).toBe(false)
    expect(stats.addedAt).toBeNull()
    expect(stats.lastUpdated).toBeNull()
  })

  it("returns presence fields when present", async () => {
    const addedAt = new Date("2024-01-01")
    const updatedAt = new Date("2024-06-01")
    mockPrisma.presence.findUnique.mockResolvedValue({
      slug: "youtube", version: "1.2.3", archived: true, addedAt, updatedAt,
    })
    mockPrisma.devicePresence.count.mockResolvedValue(100)
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(25)

    const stats = await getPresenceStats("youtube")
    expect(stats.totalInstalls).toBe(100)
    expect(stats.activeUsers).toBe(25)
    expect(stats.version).toBe("1.2.3")
    expect(stats.archived).toBe(true)
    expect(stats.addedAt).toBe("2024-01-01T00:00:00.000Z")
    expect(stats.lastUpdated).toBe("2024-06-01T00:00:00.000Z")
  })

  it("returns active users from tracked devices when present", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    mockPrisma.devicePresence.count.mockResolvedValue(100)
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 5 })
    mockPrisma.presenceActiveDevice.count.mockResolvedValue(7)

    const stats = await getPresenceStats("youtube")
    expect(stats.activeUsers).toBe(7)
    expect(mockPrisma.presenceActiveDevice.deleteMany).toHaveBeenCalled()
    expect(mockPrisma.presenceActiveDevice.count).toHaveBeenCalledWith({ where: { slug: "youtube" } })
  })
})

describe("incrementInstalls", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("increments and returns", async () => {
    mockPrisma.device.upsert.mockResolvedValue({ deviceId: "dev-1" })
    mockPrisma.devicePresence.upsert.mockResolvedValue({ deviceId: "dev-1", slug: "yt" })
    mockPrisma.devicePresence.count.mockResolvedValue(42)

    expect(await incrementInstalls("yt", "dev-1")).toBe(42)
    expect(mockPrisma.device.upsert).toHaveBeenCalled()
    expect(mockPrisma.devicePresence.upsert).toHaveBeenCalled()
    expect(mockPrisma.devicePresence.count).toHaveBeenCalledWith({ where: { slug: "yt", installed: true } })
  })
})

describe("setActiveUsers", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("is a no-op", async () => {
    await expect(setActiveUsers("yt", 10)).resolves.toBeUndefined()
  })
})

describe("markActiveDevice / clearActiveDevice", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("tracks active devices via upsert", async () => {
    mockPrisma.presenceActiveDevice.upsert.mockResolvedValue({ slug: "yt", deviceId: "device-1" })
    await markActiveDevice("yt", "device-1", 123)
    expect(mockPrisma.presenceActiveDevice.upsert).toHaveBeenCalledWith({
      where: { slug_deviceId: { slug: "yt", deviceId: "device-1" } },
      create: { slug: "yt", deviceId: "device-1", lastSeenAt: expect.any(Date) },
      update: { lastSeenAt: expect.any(Date) },
    })
  })

  it("removes an active device from a presence", async () => {
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 1 })
    await clearActiveDevice("yt", "device-1")
    expect(mockPrisma.presenceActiveDevice.deleteMany).toHaveBeenCalledWith({
      where: { slug: "yt", deviceId: "device-1" },
    })
  })

  it("clears a device across every presence", async () => {
    mockPrisma.presenceActiveDevice.deleteMany.mockResolvedValue({ count: 2 })
    await clearActiveDevicesForDevice("device-1")
    expect(mockPrisma.presenceActiveDevice.deleteMany).toHaveBeenCalledWith({
      where: { deviceId: "device-1" },
    })
  })
})

describe("setUpdated / setAdded", () => {
  beforeEach(() => vi.clearAllMocks())

  it("upserts updated with provided date", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setUpdated("yt", "2024-06-01")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", updatedAt: new Date("2024-06-01") },
      update: { updatedAt: new Date("2024-06-01") },
    })
  })

  it("upserts updated with auto date when not provided", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    const before = Date.now()
    await setUpdated("yt")
    expect(mockPrisma.presence.upsert).toHaveBeenCalled()
    const call = mockPrisma.presence.upsert.mock.calls[0][0]
    expect(call.where.slug).toBe("yt")
    expect(call.create.updatedAt.getTime()).toBeGreaterThanOrEqual(before)
  })

  it("upserts added with provided date", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setAdded("yt", "2024-01-01")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", addedAt: new Date("2024-01-01") },
      update: { addedAt: new Date("2024-01-01") },
    })
  })

  it("upserts added with auto date when not provided", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setAdded("yt")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", addedAt: expect.any(Date) },
      update: { addedAt: expect.any(Date) },
    })
  })
})

describe("setVersion / getVersion", () => {
  beforeEach(() => vi.clearAllMocks())

  it("upserts version", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setVersion("yt", "1.0.0")
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", version: "1.0.0", updatedAt: expect.any(Date) },
      update: { version: "1.0.0", updatedAt: expect.any(Date) },
    })
  })

  it("retrieves version", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue({ version: "1.0.0" })
    expect(await getVersion("yt")).toBe("1.0.0")
    expect(mockPrisma.presence.findUnique).toHaveBeenCalledWith({
      where: { slug: "yt" }, select: { version: true },
    })
  })

  it("returns null when no version", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    expect(await getVersion("yt")).toBeNull()
  })
})

describe("addVersion", () => {
  beforeEach(() => vi.clearAllMocks())

  it("upserts presence and presenceVersion", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    mockPrisma.presenceVersion.upsert.mockResolvedValue({})

    const entry = { version: "1.0.0", changelog: "Initial", author: "dev", timestamp: 123 }
    await addVersion("yt", entry)

    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", version: "1.0.0" },
      update: {},
    })

    expect(mockPrisma.presenceVersion.upsert).toHaveBeenCalledWith({
      where: { slug_version: { slug: "yt", version: "1.0.0" } },
      create: {
        slug: "yt", version: "1.0.0", changelog: "Initial", author: "dev",
        timestamp: new Date(123), createdAt: new Date(123),
      },
      update: {
        changelog: "Initial", author: "dev",
        timestamp: new Date(123), createdAt: new Date(123),
      },
    })
  })

  it("handles optional fields", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    mockPrisma.presenceVersion.upsert.mockResolvedValue({})

    const entry = {
      version: "1.0.0", changelog: "Initial", author: "dev",
      authorGithub: undefined, pr: undefined, timestamp: 456,
    }
    await addVersion("yt", entry)

    const createCall = mockPrisma.presenceVersion.upsert.mock.calls[0][0].create
    expect(createCall.authorGithub).toBeUndefined()
    expect(createCall.pr).toBeUndefined()
  })
})

describe("setPresenceMeta / getPresenceMeta", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores JSON metadata", async () => {
    mockPrisma.presence.upsert.mockResolvedValue({})
    await setPresenceMeta("yt", { name: "YT" })
    expect(mockPrisma.presence.upsert).toHaveBeenCalledWith({
      where: { slug: "yt" },
      create: { slug: "yt", metadata: { name: "YT" } },
      update: { metadata: { name: "YT" } },
    })
  })

  it("retrieves metadata", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue({ metadata: { name: "YT" } })
    expect(await getPresenceMeta("yt")).toEqual({ name: "YT" })
    expect(mockPrisma.presence.findUnique).toHaveBeenCalledWith({
      where: { slug: "yt" }, select: { metadata: true },
    })
  })

  it("returns null when missing", async () => {
    mockPrisma.presence.findUnique.mockResolvedValue(null)
    expect(await getPresenceMeta("yt")).toBeNull()
  })
})

describe("getAllPresenceSlugs", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns slugs from all presences ordered alphabetically", async () => {
    mockPrisma.presence.findMany.mockResolvedValue([
      { slug: "youtube" }, { slug: "twitch" },
    ])
    expect(await getAllPresenceSlugs()).toEqual(["youtube", "twitch"])
    expect(mockPrisma.presence.findMany).toHaveBeenCalledWith({
      where: { archived: false },
      select: { slug: true },
      orderBy: { slug: "asc" },
    })
  })

  it("includes archived slugs when requested", async () => {
    mockPrisma.presence.findMany.mockResolvedValue([{ slug: "youtube" }])
    expect(await getAllPresenceSlugs({ includeArchived: true })).toEqual(["youtube"])
    expect(mockPrisma.presence.findMany).toHaveBeenCalledWith({
      where: undefined,
      select: { slug: true },
      orderBy: { slug: "asc" },
    })
  })

  it("returns empty when none", async () => {
    mockPrisma.presence.findMany.mockResolvedValue([])
    expect(await getAllPresenceSlugs()).toEqual([])
  })
})

describe("setArchived", () => {
  beforeEach(() => vi.clearAllMocks())

  it("archives a presence that is not already archived", async () => {
    mockPrisma.presence.updateMany.mockResolvedValue({ count: 1 })
    expect(await setArchived("cinepulse", true)).toBe(true)
    expect(mockPrisma.presence.updateMany).toHaveBeenCalledWith({
      where: { slug: "cinepulse", archived: { not: true } },
      data: { archived: true },
    })
  })

  it("returns false when the presence is missing or already in that state", async () => {
    mockPrisma.presence.updateMany.mockResolvedValue({ count: 0 })
    expect(await setArchived("cinepulse", false)).toBe(false)
  })
})

describe("getVersionHistory", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns empty when none", async () => {
    mockPrisma.presenceVersion.findMany.mockResolvedValue([])
    expect(await getVersionHistory("yt")).toEqual([])
    expect(mockPrisma.presenceVersion.findMany).toHaveBeenCalledWith({
      where: { slug: "yt" },
      orderBy: { timestamp: "desc" },
    })
  })

  it("returns version entries", async () => {
    mockPrisma.presenceVersion.findMany.mockResolvedValue([
      { version: "1.0.0", changelog: "Release", author: "dev", timestamp: new Date(200), createdAt: new Date(200), authorGithub: null, releaseAuthor: null, releaseContributors: null, pr: null, source: null, commitSha: null, changedFiles: null, bundleSizeBytes: null, bundleSizeLabel: null, bundleSha256: null, versionType: null, aiGeneratedChangelog: null },
      { version: "0.9.0", changelog: "Beta", author: "dev", timestamp: new Date(100), createdAt: new Date(100), authorGithub: null, releaseAuthor: null, releaseContributors: null, pr: null, source: null, commitSha: null, changedFiles: null, bundleSizeBytes: null, bundleSizeLabel: null, bundleSha256: null, versionType: null, aiGeneratedChangelog: null },
    ])
    const history = await getVersionHistory("yt")
    expect(history).toHaveLength(2)
    expect(history[0].version).toBe("1.0.0")
    expect(history[1].version).toBe("0.9.0")
  })
})

describe("supporter passes", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates a supporter pass with a generated code", async () => {
    mockPrisma.supporterPass.create.mockResolvedValue({})

    const pass = await createSupporterPass({ provider: "manual", maxDevices: 3 })

    expect(pass.code).toMatch(/^NOWLY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    expect(pass.maxDevices).toBe(3)
    expect(mockPrisma.supporterPass.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.any(String),
        codeHash: expect.any(String),
        provider: "manual",
        maxDevices: 3,
      }),
    })
  })

  it("returns ad-free access when a device is linked to an active pass", async () => {
    mockPrisma.supporterDevice.count.mockResolvedValue(1)

    await expect(hasAdFreeAccess("device-1")).resolves.toBe(true)
    expect(mockPrisma.supporterDevice.count).toHaveBeenCalledWith({
      where: {
        deviceId: "device-1",
        pass: { status: "active" },
      },
    })
  })

  it("redeems a valid pass for a new device", async () => {
    mockPrisma.supporterPass.findUnique.mockResolvedValue({
      id: "pass-1",
      status: "active",
      maxDevices: 2,
      devices: [],
    })
    mockPrisma.supporterDevice.create.mockResolvedValue({})

    const result = await redeemSupporterCodeForDevice("NOWLY-AAAA-BBBB-CCCC", "device-1")

    expect(result).toEqual({ ok: true, adFree: true, deviceCount: 1, maxDevices: 2 })
    expect(mockPrisma.supporterDevice.create).toHaveBeenCalledWith({
      data: { passId: "pass-1", deviceId: "device-1" },
    })
  })

  it("does not consume a slot when the same device redeems again", async () => {
    mockPrisma.supporterPass.findUnique.mockResolvedValue({
      id: "pass-1",
      status: "active",
      maxDevices: 2,
      devices: [{ passId: "pass-1", deviceId: "device-1" }],
    })
    mockPrisma.supporterDevice.update.mockResolvedValue({})

    const result = await redeemSupporterCodeForDevice("NOWLY-AAAA-BBBB-CCCC", "device-1")

    expect(result).toEqual({ ok: true, adFree: true, deviceCount: 1, maxDevices: 2 })
    expect(mockPrisma.supporterDevice.create).not.toHaveBeenCalled()
    expect(mockPrisma.supporterDevice.update).toHaveBeenCalled()
  })

  it("rejects a new device when the pass device limit is reached", async () => {
    mockPrisma.supporterPass.findUnique.mockResolvedValue({
      id: "pass-1",
      status: "active",
      maxDevices: 1,
      devices: [{ passId: "pass-1", deviceId: "device-1" }],
    })

    const result = await redeemSupporterCodeForDevice("NOWLY-AAAA-BBBB-CCCC", "device-2")

    expect(result).toEqual({ ok: false, error: "device_limit_reached", maxDevices: 1 })
    expect(mockPrisma.supporterDevice.create).not.toHaveBeenCalled()
  })

  it("records a donation idempotently and creates a pass once", async () => {
    mockPrisma.donationEvent.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ passId: "pass-1" })
    mockPrisma.supporterPass.create.mockResolvedValue({})
    mockPrisma.donationEvent.create.mockResolvedValue({})

    const first = await recordDonationAndCreatePass({
      provider: "kofi",
      providerEventId: "event-1",
      amount: "5",
      currency: "eur",
      donorEmail: "supporter@example.com",
    })
    const second = await recordDonationAndCreatePass({ provider: "kofi", providerEventId: "event-1" })

    expect(first.created).toBe(true)
    expect(first.code).toMatch(/^NOWLY-/)
    expect(second).toEqual({ created: false, passId: "pass-1" })
    expect(mockPrisma.supporterPass.create).toHaveBeenCalledTimes(1)
    expect(mockPrisma.donationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        provider: "kofi",
        providerEventId: "event-1",
        amount: "5",
        currency: "EUR",
        donorEmailHash: expect.any(String),
      }),
    })
  })
})
