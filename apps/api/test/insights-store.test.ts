import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  analyticsEvent: {
    create: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    findMany: vi.fn(),
    $queryRaw: vi.fn(),
  },
  device: {
    findMany: vi.fn(),
  },
  $queryRaw: vi.fn(),
}))

vi.mock("@/db/client", () => ({
  hasDatabase: vi.fn(() => true),
  getPrisma: vi.fn(() => mockPrisma),
}))

describe("insights-store", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.analyticsEvent.create.mockResolvedValue({})
  })

  it("records a known event and sanitizes payload", async () => {
    const { recordInsightEvents } = await import("@/features/insights/insights.service")

    const result = await recordInsightEvents([
      {
        eventId: "11111111-1111-1111-1111-111111111111",
        key: "presence_error",
        deviceId: "device-1",
        slug: "YouTube",
        payload: { stage: "presence-error", url: "https://example.com", title: "secret" },
      },
    ])

    expect(result).toEqual({ inserted: 1, rejected: 0, duplicates: 0 })
    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventId: "11111111-1111-1111-1111-111111111111",
        key: "presence_error",
        deviceId: "device-1",
        slug: "youtube",
        payload: { stage: "presence-error" },
      }),
    })
  })

  it("rejects unknown event keys", async () => {
    const { recordInsightEvents } = await import("@/features/insights/insights.service")
    const result = await recordInsightEvents([{ key: "watched_video_title", deviceId: "device-1" }])
    expect(result).toEqual({ inserted: 0, rejected: 1, duplicates: 0 })
    expect(mockPrisma.analyticsEvent.create).not.toHaveBeenCalled()
  })

  it("counts unique constraint collisions as duplicates", async () => {
    const { recordInsightEvents } = await import("@/features/insights/insights.service")
    mockPrisma.analyticsEvent.create.mockRejectedValue({ code: "P2002" })

    const result = await recordInsightEvents([
      { eventId: "dup", key: "extension_install", deviceId: "device-1" },
    ])
    expect(result.duplicates).toBe(1)
    expect(result.inserted).toBe(0)
  })

  it("stores the source enum value and the server-derived country", async () => {
    const { recordInsightEvents } = await import("@/features/insights/insights.service")

    await recordInsightEvents(
      [{ eventId: "evt-1", key: "presence_install", deviceId: "device-1", slug: "youtube", source: "web_library" }],
      "FR",
    )

    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ source: "web_library", country: "FR" }),
    })
  })

  it("drops an unknown source value instead of storing it", async () => {
    const { recordInsightEvents } = await import("@/features/insights/insights.service")

    await recordInsightEvents([
      // Simulates a client bypassing the TS types entirely (e.g. hand-crafted request body).
      { eventId: "evt-2", key: "presence_install", deviceId: "device-1", source: "not_a_real_source" as never },
    ])

    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ source: undefined }),
    })
  })
})

describe("insights filters (combinable dimensions)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.analyticsEvent.count.mockResolvedValue(0)
    mockPrisma.analyticsEvent.groupBy.mockResolvedValue([])
    mockPrisma.analyticsEvent.findMany.mockResolvedValue([])
  })

  it("resolves browser/os filters to a device allowlist before querying events", async () => {
    const { getOverview } = await import("@/features/insights/insights.service")
    mockPrisma.device.findMany.mockResolvedValue([{ deviceId: "device-1" }, { deviceId: "device-2" }])

    await getOverview({ range: "7d" }, { slug: "youtube", browser: "firefox", os: "windows" })

    expect(mockPrisma.device.findMany).toHaveBeenCalledWith({
      where: { browser: "firefox", os: "windows", locale: undefined },
      select: { deviceId: true },
    })
    expect(mockPrisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ slug: "youtube", deviceId: { in: ["device-1", "device-2"] } }),
    })
  })

  it("skips the device lookup entirely when no device-level filter is set", async () => {
    const { getOverview } = await import("@/features/insights/insights.service")

    await getOverview({ range: "7d" }, { source: "extension_library" })

    expect(mockPrisma.device.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.analyticsEvent.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ source: "extension_library" }),
    })
  })
})
