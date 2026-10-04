import Fastify from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Prisma } from "../src/generated/prisma/client"

const mockPrisma = vi.hoisted(() => ({
  extensionToken: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  syncDocument: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
}))

vi.mock("@/db/client", () => ({
  hasDatabase: vi.fn(() => true),
  getPrisma: vi.fn(() => mockPrisma),
}))

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({ api: { getSession: vi.fn(async () => null) } }),
}))

const DEVICE_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50"
const AUTH = { authorization: "Bearer nxt_token" }

const buildApp = async () => {
  const { syncRoutes } = await import("@/features/sync/sync.routes")
  const app = Fastify()
  await app.register(syncRoutes, { prefix: "/sync" })
  return app
}

const token = (scopes: string[]) => ({
  id: "token-1",
  userId: "user-1",
  deviceId: DEVICE_ID,
  scopes,
  revokedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  lastUsedAt: new Date(),
})

const row = (key: string, value: unknown, version: number) => ({
  userId: "user-1",
  key,
  value,
  version,
  updatedAt: new Date("2026-10-04T10:00:00Z"),
  updatedByDeviceId: DEVICE_ID,
})

describe("sync routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.extensionToken.findUnique.mockResolvedValue(token(["sync"]))
  })

  it("requires a token with the sync scope", async () => {
    const app = await buildApp()
    expect((await app.inject({ method: "GET", url: "/sync" })).statusCode).toBe(401)
    mockPrisma.extensionToken.findUnique.mockResolvedValue(token(["creator"]))
    expect((await app.inject({ method: "GET", url: "/sync", headers: AUTH })).statusCode).toBe(401)
    await app.close()
  })

  it("lists every document with the server time", async () => {
    mockPrisma.syncDocument.findMany.mockResolvedValue([row("settings", { appearance: "dark" }, 2)])
    const app = await buildApp()
    const res = await app.inject({ method: "GET", url: "/sync", headers: AUTH })
    expect(res.statusCode).toBe(200)
    expect(res.json().documents).toEqual([{ key: "settings", value: { appearance: "dark" }, version: 2, updatedAt: "2026-10-04T10:00:00.000Z" }])
    expect(typeof res.json().serverTime).toBe("string")
    expect(mockPrisma.syncDocument.findMany).toHaveBeenCalledWith({ where: { userId: "user-1" }, orderBy: { key: "asc" } })
    await app.close()
  })

  it("filters changes since a date and validates it", async () => {
    mockPrisma.syncDocument.findMany.mockResolvedValue([])
    const app = await buildApp()
    expect((await app.inject({ method: "GET", url: "/sync/changes?since=yesterday", headers: AUTH })).statusCode).toBe(400)
    const res = await app.inject({ method: "GET", url: "/sync/changes?since=2026-10-04T09:00:00.000Z", headers: AUTH })
    expect(res.statusCode).toBe(200)
    expect(mockPrisma.syncDocument.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", updatedAt: { gte: new Date("2026-10-04T09:00:00.000Z") } },
      orderBy: { key: "asc" },
    })
    await app.close()
  })

  it("creates a document at version 1 and strips unknown or device-only fields", async () => {
    mockPrisma.syncDocument.create.mockResolvedValue({})
    const app = await buildApp()
    const res = await app.inject({
      method: "PUT",
      url: "/sync/settings",
      headers: AUTH,
      payload: { value: { appearance: "dark", customApiBaseUrl: "http://evil", developerMode: true, presencePaused: true }, baseVersion: 0 },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().version).toBe(1)
    expect(mockPrisma.syncDocument.create.mock.calls[0][0].data).toMatchObject({
      userId: "user-1",
      key: "settings",
      value: { appearance: "dark" },
      version: 1,
      updatedByDeviceId: DEVICE_ID,
    })
    await app.close()
  })

  it("updates only when baseVersion matches", async () => {
    mockPrisma.syncDocument.updateMany.mockResolvedValue({ count: 1 })
    const app = await buildApp()
    const value = [{ slug: "youtube", enabled: true, installedAt: 1 }]
    const res = await app.inject({ method: "PUT", url: "/sync/presences", headers: AUTH, payload: { value, baseVersion: 4 } })
    expect(res.statusCode).toBe(200)
    expect(res.json().version).toBe(5)
    expect(mockPrisma.syncDocument.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", key: "presences", version: 4 },
      data: expect.objectContaining({ value, version: 5 }),
    })
    await app.close()
  })

  it("answers 409 with the current document when the version moved", async () => {
    mockPrisma.syncDocument.updateMany.mockResolvedValue({ count: 0 })
    mockPrisma.syncDocument.findUnique.mockResolvedValue(row("featureReveals", { "account-sync": 5 }, 7))
    const app = await buildApp()
    const res = await app.inject({ method: "PUT", url: "/sync/featureReveals", headers: AUTH, payload: { value: {}, baseVersion: 6 } })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toEqual({ error: "VERSION_CONFLICT", value: { "account-sync": 5 }, version: 7, updatedAt: "2026-10-04T10:00:00.000Z" })
    await app.close()
  })

  it("answers 409 when another device created the document first", async () => {
    mockPrisma.syncDocument.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "7" }))
    mockPrisma.syncDocument.findUnique.mockResolvedValue(row("presenceSettings", { youtube: { lang: "fr" } }, 1))
    const app = await buildApp()
    const res = await app.inject({ method: "PUT", url: "/sync/presenceSettings", headers: AUTH, payload: { value: {}, baseVersion: 0 } })
    expect(res.statusCode).toBe(409)
    expect(res.json().version).toBe(1)
    await app.close()
  })

  it("answers 409 with version 0 when the document was erased meanwhile", async () => {
    mockPrisma.syncDocument.updateMany.mockResolvedValue({ count: 0 })
    mockPrisma.syncDocument.findUnique.mockResolvedValue(null)
    const app = await buildApp()
    const res = await app.inject({ method: "PUT", url: "/sync/featureReveals", headers: AUTH, payload: { value: {}, baseVersion: 3 } })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toEqual({ error: "VERSION_CONFLICT", value: null, version: 0, updatedAt: null })
    await app.close()
  })

  it("rejects unknown keys, invalid values and oversized documents", async () => {
    const app = await buildApp()
    expect((await app.inject({ method: "PUT", url: "/sync/currentActivity", headers: AUTH, payload: { value: {}, baseVersion: 0 } })).statusCode).toBe(404)
    expect((await app.inject({ method: "PUT", url: "/sync/settings", headers: AUTH, payload: { value: { appearance: "neon" }, baseVersion: 0 } })).statusCode).toBe(400)
    expect((await app.inject({ method: "PUT", url: "/sync/settings", headers: AUTH, payload: { value: {}, baseVersion: -1 } })).statusCode).toBe(400)
    const reveals = Object.fromEntries(Array.from({ length: 400 }, (_, index) => [`feature-${index}`, Date.now()]))
    expect((await app.inject({ method: "PUT", url: "/sync/featureReveals", headers: AUTH, payload: { value: reveals, baseVersion: 0 } })).statusCode).toBe(413)
    expect(mockPrisma.syncDocument.create).not.toHaveBeenCalled()
    await app.close()
  })

  it("accepts customActivities ahead of 2.4.0", async () => {
    mockPrisma.syncDocument.create.mockResolvedValue({})
    const app = await buildApp()
    const value = {
      items: [
        {
          id: "a1",
          name: "Studying",
          type: 0,
          details: "Chapter 3",
          state: "",
          largeImage: { kind: "icon", icon: "book", color: "#5865f2" },
          largeText: "",
          smallImage: { kind: "none" },
          smallText: "",
          timestamp: { mode: "elapsed" },
          buttons: [],
          createdAt: 1,
          updatedAt: 2,
        },
      ],
      activeId: "a1",
    }
    const res = await app.inject({ method: "PUT", url: "/sync/customActivities", headers: AUTH, payload: { value, baseVersion: 0 } })
    expect(res.statusCode).toBe(200)
    expect(mockPrisma.syncDocument.create.mock.calls[0][0].data.value).not.toHaveProperty("activeId")
    await app.close()
  })

  it("erases the server copy and signs every device out", async () => {
    mockPrisma.syncDocument.deleteMany.mockResolvedValue({ count: 4 })
    mockPrisma.extensionToken.updateMany.mockResolvedValue({ count: 2 })
    const app = await buildApp()
    const res = await app.inject({ method: "DELETE", url: "/sync", headers: AUTH })
    expect(res.json()).toEqual({ ok: true, deleted: 4 })
    expect(mockPrisma.syncDocument.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } })
    expect(mockPrisma.extensionToken.updateMany).toHaveBeenCalledWith({ where: { userId: "user-1", revokedAt: null }, data: { revokedAt: expect.any(Date) } })
    await app.close()
  })
})
