import Fastify from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockPrisma = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), deleteMany: vi.fn() },
  account: { findMany: vi.fn() },
  device: { findMany: vi.fn(), updateMany: vi.fn() },
  extensionToken: { create: vi.fn(), updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
  syncDocument: { findMany: vi.fn(), deleteMany: vi.fn() },
  presenceLike: { findMany: vi.fn(), updateMany: vi.fn() },
  $transaction: vi.fn((operations: unknown[]) => Promise.all(operations)),
}))

const mockDatabase = vi.hoisted(() => ({ available: true }))
const mockSession = vi.hoisted(() => ({ userId: null as string | null }))

vi.mock("@/db/client", () => ({
  hasDatabase: vi.fn(() => mockDatabase.available),
  getPrisma: vi.fn(() => mockPrisma),
}))

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: {
      getSession: vi.fn(async () => (mockSession.userId ? { user: { id: mockSession.userId } } : null)),
    },
  }),
}))

const USER = { id: "user-1", name: "Nolo", image: "https://cdn.discordapp.com/a.png", discordId: "1234", email: "nolo@example.com", createdAt: new Date("2026-10-01T00:00:00Z") }
const DEVICE_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50"

const buildApp = async () => {
  const { accountRoutes } = await import("@/features/account/account.routes")
  const app = Fastify()
  await app.register(accountRoutes)
  return app
}

const activeToken = (overrides: Record<string, unknown> = {}) => ({
  id: "token-1",
  userId: USER.id,
  deviceId: DEVICE_ID,
  tokenHash: "hash",
  scopes: ["sync"],
  revokedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  lastUsedAt: new Date(),
  ...overrides,
})

describe("account routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDatabase.available = true
    mockSession.userId = null
    mockPrisma.user.findUnique.mockResolvedValue(USER)
    mockPrisma.extensionToken.create.mockResolvedValue({})
    mockPrisma.extensionToken.updateMany.mockResolvedValue({ count: 0 })
  })

  afterEach(() => vi.unstubAllEnvs())

  it("refuses to mint an extension token without a site session", async () => {
    const app = await buildApp()
    const res = await app.inject({ method: "POST", url: "/extension/tokens", payload: { scopes: ["sync"] } })
    expect(res.statusCode).toBe(401)
    expect(res.json()).toEqual({ error: "UNAUTHORIZED" })
    expect(mockPrisma.extensionToken.create).not.toHaveBeenCalled()
    await app.close()
  })

  it("fails closed when the database is unavailable", async () => {
    mockDatabase.available = false
    mockSession.userId = USER.id
    const app = await buildApp()
    const res = await app.inject({ method: "POST", url: "/extension/tokens", payload: {} })
    expect(res.statusCode).toBe(503)
    await app.close()
  })

  it("mints a hashed token, revokes the device's previous ones and returns the contract shape", async () => {
    mockSession.userId = USER.id
    const app = await buildApp()
    const before = Date.now()
    const res = await app.inject({ method: "POST", url: "/extension/tokens", payload: { deviceId: DEVICE_ID, scopes: ["sync"] } })
    expect(res.statusCode).toBe(200)

    const body = res.json()
    expect(body.token).toMatch(/^nxt_[A-Za-z0-9_-]{43}$/)
    expect(body.user).toEqual({ id: USER.id, name: USER.name, image: USER.image, discordId: "1234", githubLogin: null })
    expect(body.providers).toEqual(["discord"])
    expect(typeof body.expiresAt).toBe("number")
    expect(body.expiresAt).toBeGreaterThan(before + 89 * 24 * 60 * 60 * 1000)

    expect(mockPrisma.extensionToken.updateMany).toHaveBeenCalledWith({
      where: { userId: USER.id, deviceId: DEVICE_ID, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    const created = mockPrisma.extensionToken.create.mock.calls[0][0].data
    expect(created.tokenHash).not.toBe(body.token)
    expect(created.tokenHash).not.toContain("nxt_")
    expect(created.scopes).toEqual(["sync"])
    await app.close()
  })

  it("rejects unknown scopes", async () => {
    mockSession.userId = USER.id
    const app = await buildApp()
    const res = await app.inject({ method: "POST", url: "/extension/tokens", payload: { scopes: ["admin"] } })
    expect(res.statusCode).toBe(400)
    await app.close()
  })

  it("serves /me with a bearer extension token", async () => {
    mockPrisma.extensionToken.findUnique.mockResolvedValue(activeToken())
    const app = await buildApp()
    const res = await app.inject({ method: "GET", url: "/me", headers: { authorization: "Bearer nxt_abc" } })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ id: USER.id, discordId: "1234" })
    await app.close()
  })

  it("rejects revoked or expired tokens", async () => {
    const app = await buildApp()
    mockPrisma.extensionToken.findUnique.mockResolvedValue(activeToken({ revokedAt: new Date() }))
    expect((await app.inject({ method: "GET", url: "/me", headers: { authorization: "Bearer nxt_abc" } })).statusCode).toBe(401)
    mockPrisma.extensionToken.findUnique.mockResolvedValue(activeToken({ expiresAt: new Date(Date.now() - 1) }))
    expect((await app.inject({ method: "GET", url: "/me", headers: { authorization: "Bearer nxt_abc" } })).statusCode).toBe(401)
    await app.close()
  })

  it("revokes the current token on sign out", async () => {
    mockPrisma.extensionToken.findUnique.mockResolvedValue(activeToken())
    const app = await buildApp()
    const res = await app.inject({ method: "DELETE", url: "/extension/tokens/current", headers: { authorization: "Bearer nxt_abc" } })
    expect(res.statusCode).toBe(200)
    expect(mockPrisma.extensionToken.updateMany).toHaveBeenCalledWith({ where: { id: "token-1", revokedAt: null }, data: { revokedAt: expect.any(Date) } })
    await app.close()
  })

  it("only lets the site session delete the account", async () => {
    mockPrisma.extensionToken.findUnique.mockResolvedValue(activeToken())
    const app = await buildApp()
    const byToken = await app.inject({ method: "DELETE", url: "/me", headers: { authorization: "Bearer nxt_abc" } })
    expect(byToken.statusCode).toBe(401)

    mockSession.userId = USER.id
    const bySession = await app.inject({ method: "DELETE", url: "/me" })
    expect(bySession.statusCode).toBe(200)
    expect(mockPrisma.syncDocument.deleteMany).toHaveBeenCalledWith({ where: { userId: USER.id } })
    expect(mockPrisma.extensionToken.deleteMany).toHaveBeenCalledWith({ where: { userId: USER.id } })
    expect(mockPrisma.device.updateMany).toHaveBeenCalledWith({ where: { userId: USER.id }, data: { userId: null } })
    expect(mockPrisma.user.deleteMany).toHaveBeenCalledWith({ where: { id: USER.id } })
    await app.close()
  })

  it("exports the profile, devices, synced documents and likes without token hashes", async () => {
    mockSession.userId = USER.id
    mockPrisma.account.findMany.mockResolvedValue([{ providerId: "discord", accountId: "1234", createdAt: new Date("2026-10-01T00:00:00Z") }])
    mockPrisma.extensionToken.findMany.mockResolvedValue([activeToken({ createdAt: new Date("2026-10-02T00:00:00Z") })])
    mockPrisma.syncDocument.findMany.mockResolvedValue([
      { key: "settings", value: { appearance: "dark" }, version: 3, updatedAt: new Date("2026-10-03T00:00:00Z"), updatedByDeviceId: DEVICE_ID },
    ])
    mockPrisma.presenceLike.findMany.mockResolvedValue([{ slug: "youtube", deviceId: DEVICE_ID, likedAt: new Date("2026-10-03T00:00:00Z") }])
    mockPrisma.device.findMany.mockResolvedValue([
      { deviceId: DEVICE_ID, browser: "chrome", os: "windows", extensionVersion: "2.3.0", lastSeenAt: new Date("2026-10-04T00:00:00Z") },
    ])

    const app = await buildApp()
    const res = await app.inject({ method: "GET", url: "/me/export" })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.profile.email).toBe(USER.email)
    expect(body.syncDocuments).toEqual([
      { key: "settings", value: { appearance: "dark" }, version: 3, updatedAt: "2026-10-03T00:00:00.000Z", updatedByDeviceId: DEVICE_ID },
    ])
    expect(body.presenceLikes).toEqual([{ slug: "youtube", deviceId: DEVICE_ID, likedAt: "2026-10-03T00:00:00.000Z" }])
    expect(body.devices[0]).toMatchObject({ deviceId: DEVICE_ID, browser: "chrome" })
    expect(JSON.stringify(body)).not.toContain("tokenHash")
    await app.close()
  })

  it("lists linked devices and flags the current one", async () => {
    mockPrisma.extensionToken.findUnique.mockResolvedValue(activeToken())
    mockPrisma.device.findMany.mockResolvedValue([
      { deviceId: DEVICE_ID, browser: "chrome", os: "windows", extensionVersion: "2.3.0", lastSeenAt: new Date("2026-10-04T00:00:00Z") },
      { deviceId: "other", browser: "firefox", os: "linux", extensionVersion: "2.3.0", lastSeenAt: new Date("2026-10-03T00:00:00Z") },
    ])
    const app = await buildApp()
    const res = await app.inject({ method: "GET", url: "/me/devices", headers: { authorization: "Bearer nxt_abc" } })
    expect(res.json().devices.map((device: { current: boolean }) => device.current)).toEqual([true, false])
    await app.close()
  })

  it("unlinks a device and revokes its tokens", async () => {
    mockSession.userId = USER.id
    mockPrisma.device.updateMany.mockResolvedValue({ count: 1 })
    const app = await buildApp()
    const res = await app.inject({ method: "DELETE", url: `/me/devices/${DEVICE_ID}` })
    expect(res.statusCode).toBe(200)
    expect(mockPrisma.device.updateMany).toHaveBeenCalledWith({ where: { userId: USER.id, deviceId: DEVICE_ID }, data: { userId: null } })
    expect(mockPrisma.extensionToken.updateMany).toHaveBeenCalledWith({
      where: { userId: USER.id, deviceId: DEVICE_ID, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    await app.close()
  })
})
