import { createCacheId, fetchImage, parseProxyUrl } from "@/features/image-proxy/image-proxy.service"
import { afterEach, describe, expect, it, vi } from "vitest"

describe("parseProxyUrl", () => {
  it("matches a known service by host suffix", () => {
    const result = parseProxyUrl("https://i.ytimg.com/foo.jpg")
    expect(result?.service.id).toBe("youtube")
  })

  it("rejects a host that matches no known service (the generic entry has no host suffixes to match)", () => {
    expect(parseProxyUrl("https://example.com/foo.jpg")).toBeNull()
  })

  it("honors an explicit serviceId over host matching", () => {
    const result = parseProxyUrl("https://example.com/foo.jpg", "twitch")
    expect(result?.service.id).toBe("twitch")
  })

  it("rejects non-http(s) protocols", () => {
    expect(parseProxyUrl("ftp://example.com/foo.jpg")).toBeNull()
  })

  it("rejects an invalid URL", () => {
    expect(parseProxyUrl("not-a-url")).toBeNull()
  })

  it("rejects an empty/undefined URL", () => {
    expect(parseProxyUrl(undefined)).toBeNull()
    expect(parseProxyUrl("  ")).toBeNull()
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
    expect(result).toEqual({ ok: false, status: 404, error: "Upstream returned 404" })
  })

  it("rejects an empty response body", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      arrayBuffer: async () => new ArrayBuffer(0),
    }) as unknown as typeof fetch

    const result = await fetchImage(new URL("https://example.com/x.png"), { id: "generic", hostSuffixes: [] })
    expect(result).toEqual({ ok: false, status: 502, error: "Empty image" })
  })
})
