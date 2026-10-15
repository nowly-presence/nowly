import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { CUSTOM_IMAGE_MAX_BYTES, checkUpload, customAssetKey, detectImageMime } from "@/features/custom-assets/custom-assets.service"

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex")

describe("detectImageMime", () => {
  it("recognises the four allowed formats", () => {
    expect(detectImageMime(PNG)).toBe("image/png")
    expect(detectImageMime(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg")
    expect(detectImageMime(new TextEncoder().encode("RIFF0000WEBPVP8 "))).toBe("image/webp")
    expect(detectImageMime(new TextEncoder().encode("GIF89a"))).toBe("image/gif")
  })

  it("rejects anything else", () => {
    expect(detectImageMime(new TextEncoder().encode("<svg xmlns"))).toBeNull()
  })
})

describe("checkUpload", () => {
  it("accepts a matching image", () => {
    expect(checkUpload(PNG, "image/png", sha(PNG))).toEqual({ ok: true })
  })

  it("refuses a declared type that does not match the bytes", () => {
    expect(checkUpload(PNG, "image/jpeg", sha(PNG))).toMatchObject({ ok: false, status: 415 })
  })

  it("refuses a wrong hash", () => {
    expect(checkUpload(PNG, "image/png", "0".repeat(64))).toMatchObject({ ok: false, status: 400 })
  })

  it("refuses files over the size limit", () => {
    const big = new Uint8Array(CUSTOM_IMAGE_MAX_BYTES + 1)
    big.set(PNG)
    expect(checkUpload(big, "image/png", sha(big))).toMatchObject({ ok: false, status: 413 })
  })
})

describe("customAssetKey", () => {
  it("hides the device id and keeps the hash and extension", () => {
    const key = customAssetKey("device-1", "a".repeat(64), "image/webp")
    expect(key).toMatch(/^custom\/[0-9a-f]{64}\/a{64}\.webp$/)
    expect(key).not.toContain("device-1")
  })
})
