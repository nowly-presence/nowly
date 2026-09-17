import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  analyticsEvent: {
    create: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    findMany: vi.fn(),
    $queryRaw: vi.fn(),
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
})
