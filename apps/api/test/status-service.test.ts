import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => {
  const samples: Array<{
    id: number
    serviceId: string
    checkedAt: Date
    status: string
    responseMs: number | null
    httpStatus: number | null
    error: string | null
  }> = []

  const statusSample = {
    createMany: vi.fn(async ({ data }: { data: Omit<typeof samples[number], "id">[] }) => {
      const nextId = samples.length + 1
      samples.push(...data.map((sample, index) => ({ ...sample, id: nextId + index })))
      return { count: data.length }
    }),
    findMany: vi.fn(async ({
      where,
      skip = 0,
      take,
      select,
    }: {
      where: { serviceId: string }
      skip?: number
      take?: number
      select?: { id?: boolean; checkedAt?: boolean }
    }) => {
      const results = samples
        .filter((sample) => sample.serviceId === where.serviceId)
        .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime() || b.id - a.id)
        .slice(skip, take === undefined ? undefined : skip + take)

      return select ? results.map(({ id, checkedAt }) => ({ id, checkedAt })) : results
    }),
    deleteMany: vi.fn(async () => ({ count: 0 })),
  }

  return { samples, statusSample }
})

vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => mockPrisma),
  hasDatabase: vi.fn(() => true),
}))

describe("status service persistence", () => {
  beforeEach(() => {
    mockPrisma.samples.length = 0
    vi.clearAllMocks()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }))
  })

  afterEach(() => vi.unstubAllGlobals())

  it("stores check samples and serves the latest values from the database", async () => {
    const { runStatusCheck } = await import("@/features/status/status.service")
    const result = await runStatusCheck()

    vi.resetModules()
    const { getStatusReport } = await import("@/features/status/status.service")
    const report = await getStatusReport()

    expect(mockPrisma.statusSample.createMany).toHaveBeenCalledOnce()
    expect(mockPrisma.samples).toHaveLength(4)
    expect(result.report.services.map((service) => service.current?.status)).toEqual([
      "operational", "operational", "operational", "operational",
    ])
    expect(report.services.map((service) => service.current?.serviceId)).toEqual([
      "website", "api", "library", "cdn",
    ])
  })
})
