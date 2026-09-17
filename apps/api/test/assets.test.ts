import { fetchAssetFromCdn } from "@/features/assets/assets.service"
import { afterEach, describe, expect, it, vi } from "vitest"

describe("fetchAssetFromCdn", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it("returns the first extension that resolves", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new Uint8Array([1, 2]).buffer,
    }) as unknown as typeof fetch

    const result = await fetchAssetFromCdn("slug", "logo")
    expect(result?.mime).toBe("image/png")
    expect(global.fetch).toHaveBeenCalledWith("https://cdn.nowly.me/presences/slug/assets/logo.png")
  })

  it("falls back to jpg then jpeg when png is missing", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer }) as unknown as typeof fetch

    const result = await fetchAssetFromCdn("slug", "icon")
    expect(result?.mime).toBe("image/jpeg")
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it("returns null when no extension resolves", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch

    const result = await fetchAssetFromCdn("slug", "thumbnail")
    expect(result).toBeNull()
  })

  it("treats a fetch rejection like a miss and keeps trying", async () => {
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new Uint8Array([1]).buffer }) as unknown as typeof fetch

    const result = await fetchAssetFromCdn("slug", "icon")
    expect(result?.mime).toBe("image/jpeg")
  })
})
