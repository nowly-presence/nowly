import { imageProxyRoutes } from "@/features/image-proxy/image-proxy.routes"
import { presenceRoutes } from "@/features/presence/presence.routes"
import cors from "@fastify/cors"
import Fastify from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockPresenceRepo = vi.hoisted(() => ({
  getAllPresenceSlugs: vi.fn(),
  getPresenceMeta: vi.fn(),
  getVersion: vi.fn(),
  getPresenceStats: vi.fn(),
  getGlobalPresenceStats: vi.fn(),
  incrementInstalls: vi.fn(),
  setActiveUsers: vi.fn(),
  markActiveDevice: vi.fn(),
  clearActiveDevice: vi.fn(),
  clearActiveDevicesForDevice: vi.fn(),
  setPresenceMeta: vi.fn(),
  setVersion: vi.fn(),
  setAdded: vi.fn(),
  setUpdated: vi.fn(),
  addVersion: vi.fn(),
  getVersionHistory: vi.fn(),
}))

vi.mock("@/features/presence/presence.repository", () => mockPresenceRepo)

vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => ({})),
  hasDatabase: vi.fn(() => true),
}))

const mockAuth = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  hashDiscordId: vi.fn(),
}))

vi.mock("@/features/auth/auth.service", () => mockAuth)

const mockCrypto = vi.hoisted(() => ({
  sha256Base64Url: vi.fn(),
  canonicalJson: vi.fn(),
  signedPayload: vi.fn(),
  signPresenceRelease: vi.fn(),
}))

vi.mock("@/shared/crypto.service", () => mockCrypto)

async function buildApp() {
  const app = Fastify()
  await app.register(cors, { origin: true })
  await app.register(presenceRoutes, { prefix: "/presences" })
  await app.register(imageProxyRoutes)
  return app
}

describe("Registry Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.API_SECRET_KEY
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.API_SECRET_KEY
  })

  it("GET /presences returns empty array when no slugs", async () => {
    mockPresenceRepo.getAllPresenceSlugs.mockResolvedValue([])

    const res = await app.inject({ method: "GET", url: "/presences" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual([])
  })

  it("GET /presences returns registry with metadata and stats", async () => {
    const meta = {
      name: "YouTube",
      slug: "youtube",
      author: { name: "Gaëtan H", github: "steellgold" },
      category: "streaming",
      description: { "en-US": "Watch videos" },
      color: "#FF0033",
      url: ["youtube.com"],
      assets: { logo: "logo.png", icon: "icon.png", thumbnail: "thumbnail.jpg" },
      tags: ["video"],
    }
    const stats = {
      totalInstalls: 500, activeUsers: 42,
      version: "1.0.0", addedAt: null, lastUpdated: null,
    }

    mockPresenceRepo.getAllPresenceSlugs.mockResolvedValue(["youtube"])
    mockPresenceRepo.getPresenceMeta.mockResolvedValue(meta)
    mockPresenceRepo.getPresenceStats.mockResolvedValue(stats)

    const res = await app.inject({ method: "GET", url: "/presences" })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveLength(1)
    expect(body[0].slug).toBe("youtube")
    expect(body[0].name).toBe("YouTube")
    expect(body[0].version).toBe("1.0.0")
    expect(body[0].totalInstalls).toBe(500)
    expect(body[0].activeUsers).toBe(42)
  })

  it("GET /presences/stats returns global public stats", async () => {
    mockPresenceRepo.getGlobalPresenceStats.mockResolvedValue({
      totalUsers: 1200,
      activeUsers: 84,
      activePresenceCount: 96,
      installedPresenceCount: 2400,
    })

    const res = await app.inject({ method: "GET", url: "/presences/stats" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({
      totalUsers: 1200,
      activeUsers: 84,
      activePresenceCount: 96,
      installedPresenceCount: 2400,
    })
  })
})

describe("Presence Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.API_SECRET_KEY
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.API_SECRET_KEY
  })

  it("GET /presences/:slug returns 404 for unknown", async () => {
    mockPresenceRepo.getPresenceMeta.mockResolvedValue(null)

    const res = await app.inject({ method: "GET", url: "/presences/nonexistent" })

    expect(res.statusCode).toBe(404)
  })

  it("GET /presences/:slug returns 200 with release data", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve("console.log('hello')") } as Response)
    )

    mockPresenceRepo.getPresenceMeta.mockResolvedValue({
      name: "YouTube",
      author: { name: "test" },
      category: "streaming",
      description: { "en-US": "Watch videos" },
      url: ["youtube.com"],
      color: "#FF0033",
      assets: { logo: "logo.png", icon: "icon.png", thumbnail: "thumbnail.jpg" },
      settings: {},
    })

    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 100, activeUsers: 10,
      version: "1.0.0", addedAt: "2024-01-01", lastUpdated: "2024-06-01",
    })

    mockCrypto.sha256Base64Url.mockReturnValue("abc123")
    mockCrypto.canonicalJson.mockReturnValue('{"name":"YouTube"}')
    mockCrypto.signedPayload.mockReturnValue("signed-payload")
    mockCrypto.signPresenceRelease.mockReturnValue("signature-value")

    const res = await app.inject({ method: "GET", url: "/presences/youtube" })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.slug).toBe("youtube")
    expect(body.version).toBe("1.0.0")
    expect(body.bundle).toBe("console.log('hello')")
    expect(body.sha256).toBe("abc123")
    expect(body.metadataHash).toBeDefined()
    expect(body.signature).toBe("signature-value")
    expect(body.totalInstalls).toBe(100)
    expect(body.activeUsers).toBe(10)

    globalThis.fetch = originalFetch
  })

  it("GET /presences/:slug/versions returns version history", async () => {
    const history = [
      { version: "1.0.0", changelog: '{"en-US":"First release","fr-FR":"Première version","es-ES":"Primera versión"}', author: "test", timestamp: 1700000000000 },
      { version: "0.0.1", changelog: "", author: "test", timestamp: 1690000000000 },
    ]

    mockPresenceRepo.getVersionHistory.mockResolvedValue(history)

    const res = await app.inject({ method: "GET", url: "/presences/youtube/versions" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual(history)
  })

  it("PUT /presences/:slug returns 401 without auth when secret is configured", async () => {
    process.env.API_SECRET_KEY = "test-secret"

    const res = await app.inject({
      method: "PUT",
      url: "/presences/youtube",
      payload: { version: "1.0.0" },
    })

    expect(res.statusCode).toBe(401)
  })

  it("PUT /presences/:slug returns 200 with valid auth", async () => {
    process.env.API_SECRET_KEY = "test-secret"

    mockPresenceRepo.setVersion.mockResolvedValue(undefined as any)
    mockPresenceRepo.addVersion.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "PUT",
      url: "/presences/youtube",
      headers: { authorization: "Bearer test-secret" },
      payload: {
        version: "2.0.0",
        changelog: "Big update",
        author: "dev",
        authorGithub: "dev-github",
        pr: "42",
        added: "2024-01-01",
        updated: "2024-06-01",
      },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(mockPresenceRepo.setVersion).toHaveBeenCalledWith("youtube", "2.0.0")
    expect(mockPresenceRepo.addVersion).toHaveBeenCalled()
    expect(mockPresenceRepo.setAdded).toHaveBeenCalledWith("youtube", "2024-01-01")
    expect(mockPresenceRepo.setUpdated).toHaveBeenCalledWith("youtube", "2024-06-01")
  })

  it("POST /presences/sync returns 401 without auth", async () => {
    process.env.API_SECRET_KEY = "test-secret"

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: { presences: [] },
    })

    expect(res.statusCode).toBe(401)
  })

  it("POST /presences/sync processes presences and returns results", async () => {
    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 0, activeUsers: 0,
      version: null, addedAt: null, lastUpdated: null,
    })
    mockPresenceRepo.setVersion.mockResolvedValue(undefined as any)
    mockPresenceRepo.setPresenceMeta.mockResolvedValue(undefined as any)
    mockPresenceRepo.setAdded.mockResolvedValue(undefined as any)
    mockPresenceRepo.addVersion.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: {
        presences: [{
          slug: "youtube",
          type: "new",
          name: "YouTube",
          category: "video",
          author: "dev",
          description: { "en-US": "Watch videos" },
        }],
        pr: "42",
        prTitle: "Add YouTube presence",
      },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body.ok).toBe(true)
    expect(body.results).toHaveLength(1)
    expect(body.results[0].slug).toBe("youtube")
    expect(body.results[0].version).toBe("1.0.0")
    expect(body.results[0].changelog).toBeTruthy()
    expect(mockPresenceRepo.setVersion).toHaveBeenCalledWith("youtube", "1.0.0")
    expect(mockPresenceRepo.setAdded).toHaveBeenCalledWith("youtube")
    expect(mockPresenceRepo.setPresenceMeta).toHaveBeenCalledWith("youtube", expect.objectContaining({
      slug: "youtube", name: "YouTube", author: "dev", category: "video",
    }))
  })
})

describe("Stats Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>

  beforeEach(async () => {
    vi.clearAllMocks()
    delete process.env.API_SECRET_KEY
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    delete process.env.API_SECRET_KEY
  })

  it("POST /presences/active updates multiple presences", async () => {
    mockPresenceRepo.markActiveDevice.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "POST",
      url: "/presences/active",
      payload: { presences: ["youtube", "twitch"], deviceId: "device-123" },
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, count: 2 })
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledTimes(2)
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledWith("youtube", "device-123")
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledWith("twitch", "device-123")
  })

  it("DELETE /presences/active/:deviceId/:slug clears one tracked presence", async () => {
    mockPresenceRepo.clearActiveDevice.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/active/device-123/youtube",
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, removed: 1 })
    expect(mockPresenceRepo.clearActiveDevice).toHaveBeenCalledWith("youtube", "device-123")
  })

  it("DELETE /presences/active/:deviceId clears every tracked presence", async () => {
    mockPresenceRepo.clearActiveDevicesForDevice.mockResolvedValue(undefined as any)

    const res = await app.inject({
      method: "DELETE",
      url: "/presences/active/device-123",
    })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true, removed: null })
    expect(mockPresenceRepo.clearActiveDevicesForDevice).toHaveBeenCalledWith("device-123")
  })

})

describe("Image Proxy Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>
  const originalFetch = globalThis.fetch

  beforeEach(async () => {
    vi.clearAllMocks()
    app = await buildApp()
  })

  afterEach(async () => {
    await app.close()
    globalThis.fetch = originalFetch
  })

  it("GET /image-proxy rejects unsupported CDN URLs", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?url=${encodeURIComponent("https://example.com/image.jpg")}`,
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: "Invalid image URL" })
  })

  it("GET /image-proxy rejects unencoded nested query parameters", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/image-proxy?service=tiktok&url=https://p16-common-sign.tiktokcdn-eu.com/image.jpg?dr=1&x-signature=abc",
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({
      error: "Image URL must be encoded",
      message: "Encode the full image URL with encodeURIComponent before passing it to the url parameter.",
    })
  })

  it("GET /image-proxy returns fetched TikTok CDN images", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg")}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/jpeg")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([1, 2, 3]))
    const fetchMock = vi.mocked(globalThis.fetch)
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://p16-common-sign.tiktokcdn-eu.com/image.jpg",
    )
    expect(fetchMock.mock.calls[0][1]).toBeTruthy()
  })

  it("GET /i returns fetched supported CDN images with a short URL", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([16, 17, 18]), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "GET",
      url: `/i?u=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg?x=1&y=2")}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/jpeg")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([16, 17, 18]))
    const fetchMock = vi.mocked(globalThis.fetch)
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://p16-common-sign.tiktokcdn-eu.com/image.jpg?x=1&y=2",
    )
    expect(fetchMock.mock.calls[0][1]).toBeTruthy()
  })

  it("POST /images-proxy caches fetched images and returns a short public URL", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([21, 22, 23]), {
      status: 200,
      headers: { "content-type": "image/png", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.png?x=1&y=2",
      },
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["access-control-allow-origin"]).toBe("*")

    const body = JSON.parse(res.body) as { url: string; expiresIn: number }
    expect(body.url).toMatch(
      /^http:\/\/localhost(?::\d+)?\/images-proxy\/[a-zA-Z0-9_-]{32}$/,
    )
    expect(body.expiresIn).toBe(300)
  })

  it("POST /images-proxy reuses a cached image URL without refetching", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.jpg",
      },
    })

    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { url: string }
    expect(body.url).toContain("/images-proxy/")

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    globalThis.fetch = vi.fn()

    const res2 = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/image.jpg",
      },
    })

    expect(res2.statusCode).toBe(200)
    const body2 = JSON.parse(res2.body) as { url: string }
    expect(body2.url).toBe(body.url)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("GET /images-proxy/:id returns a cached image", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([31, 32, 33]), {
      status: 200,
      headers: { "content-type": "image/webp", "content-length": "3" },
    }))

    const postRes = await app.inject({
      method: "POST",
      url: "/images-proxy",
      payload: {
        service: "tiktok",
        url: "https://p16-common-sign.tiktokcdn-eu.com/cached-image.webp",
      },
    })
    const { url: imageUrl } = JSON.parse(postRes.body) as { url: string }
    const id = imageUrl.split("/").pop()!

    const res = await app.inject({
      method: "GET",
      url: `/images-proxy/${id}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/webp")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([31, 32, 33]))
  })

  it("GET /images-proxy/:id returns 404 when the cached image does not exist", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/images-proxy/nonexistent_id_1234567890abc",
    })

    expect(res.statusCode).toBe(404)
    expect(JSON.parse(res.body)).toEqual({ error: "Image not found" })
  })

  it("GET /image-proxy supports explicit service matching", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([4, 5, 6]), {
      status: 200,
      headers: { "content-type": "image/webp", "content-length": "3" },
    }))

    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?service=tiktok&url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.webp")}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/webp")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([4, 5, 6]))
  })

  it("GET /image-proxy supports CANAL+ CDN images", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([7, 8, 9]), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "3" },
    }))

    const url = "https://thumb.canalplus.pro/bran/unsafe/512x512/filters:quality(80)/image/02/4/cinema.68024.jpg"
    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?service=canalplus&url=${encodeURIComponent(url)}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/jpeg")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([7, 8, 9]))
    const fetchMock = vi.mocked(globalThis.fetch)
    expect(fetchMock.mock.calls[0][0]).toBe(url)
  })

  it("GET /image-proxy supports GitHub images", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array([10, 11, 12]), {
      status: 200,
      headers: { "content-type": "image/png", "content-length": "3" },
    }))

    const url = "https://avatars.githubusercontent.com/u/9919?s=512"
    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?service=github&url=${encodeURIComponent(url)}`,
    })

    expect(res.statusCode).toBe(200)
    expect(res.headers["content-type"]).toBe("image/png")
    expect(Buffer.from(res.rawPayload)).toEqual(Buffer.from([10, 11, 12]))
    const fetchMock = vi.mocked(globalThis.fetch)
    expect(fetchMock.mock.calls[0][0]).toBe(url)
  })

  it("GET /image-proxy rejects URLs that do not match the explicit service", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/image-proxy?service=unknown&url=${encodeURIComponent("https://p16-common-sign.tiktokcdn-eu.com/image.jpg")}`,
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body)).toEqual({ error: "Invalid image URL" })
  })
})