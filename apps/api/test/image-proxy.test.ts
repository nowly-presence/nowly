import { createCacheId, fetchImage, parseProxyUrl } from "@/features/image-proxy/image-proxy.service"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockPresenceRepo = vi.hoisted(() => ({
  getAllPresenceMetas: vi.fn(),
}))

vi.mock("@/features/presence/presence.repository", () => mockPresenceRepo)
vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => ({})),
  hasDatabase: vi.fn(() => true),
}))

describe("parseProxyUrl", () => {
  beforeEach(() => {
    mockPresenceRepo.getAllPresenceMetas.mockResolvedValue([
      { slug: "tiktok", metadata: { imageProxy: { hostSuffixes: ["tiktokcdn.com"] } } },
      { slug: "canalplus", metadata: { imageProxy: { hostSuffixes: ["thumb.canalplus.pro"] } } },
    ])
  })

  it("matches a known service by host suffix", async () => {
    const result = await parseProxyUrl("https://p16.tiktokcdn.com/foo.jpg")
    expect(result?.service.id).toBe("tiktok")
  })

  it("rejects a host that matches no known presence's declared imageProxy config", async () => {
    expect(await parseProxyUrl("https://example.com/foo.jpg")).toBeNull()
  })

  it("honors an explicit serviceId over host matching", async () => {
    const result = await parseProxyUrl("https://example.com/foo.jpg", "canalplus")
    expect(result?.service.id).toBe("canalplus")
  })

  it("rejects non-http(s) protocols", async () => {
    expect(await parseProxyUrl("ftp://example.com/foo.jpg")).toBeNull()
  })

  it("rejects an invalid URL", async () => {
    expect(await parseProxyUrl("not-a-url")).toBeNull()
  })

  it("rejects an empty/undefined URL", async () => {
    expect(await parseProxyUrl(undefined)).toBeNull()
    expect(await parseProxyUrl("  ")).toBeNull()
  })

  it("rejects an unknown serviceId", async () => {
    expect(await parseProxyUrl("https://example.com/foo.jpg", "some-new-presence")).toBeNull()
  })
})

describe("createCacheId", () => {
  it("is deterministic for the same input", () => {
    expect(createCacheId("generic", "https://a.com/x.png")).toBe(createCacheId("generic", "https://a.com/x.png"))
  })

  it("differs for different services or urls", () => {
    expect(createCacheId("generic", "https://a.com/x.png")).not.toBe(createCacheId("twitch", "https://a.com/x.png"))
  })
})

describe("fetchImage", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("returns the image on a successful fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "image/png" }),
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    }) as unknown as typeof fetch

    const result = await fetchImage(new URL("https://example.com/x.png"), { id: "generic", hostSuffixes: [] })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.contentType).toBe("image/png")
      expect(result.buffer.byteLength).toBe(3)
    }
  })

  it("propagates the upstream status on a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    }) as unknown as typeof fetch

    const result = await fetchImage(new URL("https://example.com/x.png"), { id: "generic", hostSuffixes: [] })
    expect(result).toEqual({ ok: false, status: 404, error: "IMAGE_UPSTREAM_ERROR" })
  })

  it("rejects an empty response body", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
    }) as unknown as typeof fetch

    const result = await fetchImage(new URL("https://example.com/x.png"), { id: "generic", hostSuffixes: [] })
    expect(result).toEqual({ ok: false, status: 502, error: "EMPTY_IMAGE" })
  })
})
