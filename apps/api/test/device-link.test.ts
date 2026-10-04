import { deriveDeviceToken } from "@/features/device/device-token"
import Fastify from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  extensionToken: { findUnique: vi.fn(), update: vi.fn() },
  device: { upsert: vi.fn(), findUnique: vi.fn() },
  presenceLike: { updateMany: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), count: vi.fn(), upsert: vi.fn() },
}))

vi.mock("@/db/client", () => ({
  hasDatabase: vi.fn(() => true),
  getPrisma: vi.fn(() => mockPrisma),
}))

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({ api: { getSession: vi.fn(async () => null) } }),
}))

const DEVICE_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50"
const OTHER_DEVICE = "1f0e2d3c-4b5a-4968-8776-655443322110"

const buildApp = async () => {
  const { deviceRoutes } = await import("@/features/device/device.routes")
  const app = Fastify()
  await app.register(deviceRoutes, { prefix: "/devices" })
  return app
}

const token = (deviceId: string | null) => ({
  id: "token-1",
  userId: "user-1",
  deviceId,
  scopes: ["sync"],
  revokedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  lastUsedAt: new Date(),
})

describe("POST /devices/:deviceId/link", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.extensionToken.findUnique.mockResolvedValue(token(DEVICE_ID))
    mockPrisma.presenceLike.findMany.mockResolvedValue([])
  })

  it("needs both the bearer token and the device token", async () => {
    const app = await buildApp()
    const noBearer = await app.inject({ method: "POST", url: `/devices/${DEVICE_ID}/link`, headers: { "x-device-token": deriveDeviceToken(DEVICE_ID) } })
    expect(noBearer.statusCode).toBe(401)
    const noDeviceToken = await app.inject({ method: "POST", url: `/devices/${DEVICE_ID}/link`, headers: { authorization: "Bearer nxt_a" } })
    expect(noDeviceToken.statusCode).toBe(401)
    expect(mockPrisma.device.upsert).not.toHaveBeenCalled()
    await app.close()
  })

  it("refuses a token issued for another device", async () => {
    mockPrisma.extensionToken.findUnique.mockResolvedValue(token(OTHER_DEVICE))
    const app = await buildApp()
    const res = await app.inject({
      method: "POST",
      url: `/devices/${DEVICE_ID}/link`,
      headers: { authorization: "Bearer nxt_a", "x-device-token": deriveDeviceToken(DEVICE_ID) },
    })
    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it("links the device, moves its likes to the account and keeps one like per presence", async () => {
    mockPrisma.extensionToken.findUnique.mockResolvedValue(token(null))
    mockPrisma.presenceLike.findMany.mockResolvedValue([
      { slug: "youtube", deviceId: OTHER_DEVICE },
      { slug: "twitch", deviceId: DEVICE_ID },
      { slug: "youtube", deviceId: DEVICE_ID },
    ])
    const app = await buildApp()
    const res = await app.inject({
      method: "POST",
      url: `/devices/${DEVICE_ID}/link`,
      headers: { authorization: "Bearer nxt_a", "x-device-token": deriveDeviceToken(DEVICE_ID) },
    })
    expect(res.statusCode).toBe(200)
    expect(mockPrisma.device.upsert).toHaveBeenCalledWith({
      where: { deviceId: DEVICE_ID },
      create: { deviceId: DEVICE_ID, userId: "user-1" },
      update: { userId: "user-1" },
    })
    expect(mockPrisma.presenceLike.updateMany).toHaveBeenCalledWith({ where: { deviceId: DEVICE_ID }, data: { userId: "user-1" } })
    expect(mockPrisma.presenceLike.deleteMany).toHaveBeenCalledWith({ where: { OR: [{ slug: "youtube", deviceId: DEVICE_ID }] } })
    expect(mockPrisma.extensionToken.update).toHaveBeenCalledWith({ where: { id: "token-1" }, data: { deviceId: DEVICE_ID } })
    await app.close()
  })
})

describe("likes on a linked device", () => {
  beforeEach(() => vi.clearAllMocks())

  it("does not count a second like from another device of the same account", async () => {
    const { likePresence, hasLikedPresence } = await import("@/features/presence/presence.repository")
    mockPrisma.device.findUnique.mockResolvedValue({ userId: "user-1" })
    mockPrisma.presenceLike.count.mockResolvedValue(1)

    await likePresence("youtube", DEVICE_ID)
    expect(mockPrisma.presenceLike.upsert).not.toHaveBeenCalled()
    expect(await hasLikedPresence("youtube", DEVICE_ID)).toBe(true)
    expect(mockPrisma.presenceLike.count).toHaveBeenLastCalledWith({ where: { slug: "youtube", OR: [{ deviceId: DEVICE_ID }, { userId: "user-1" }] } })
  })

  it("stores anonymous likes per device as before", async () => {
    const { likePresence } = await import("@/features/presence/presence.repository")
    mockPrisma.device.findUnique.mockResolvedValue(null)

    await likePresence("youtube", DEVICE_ID)
    expect(mockPrisma.presenceLike.upsert).toHaveBeenCalledWith({
      where: { slug_deviceId: { slug: "youtube", deviceId: DEVICE_ID } },
      create: { slug: "youtube", deviceId: DEVICE_ID, userId: null },
      update: {},
    })
  })
})
