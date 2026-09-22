import { canonicalJson } from "@nowly/shared"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { installChromeMock } from "@/test/chrome-mock"
import type { PresenceRelease } from "@/shared/types"

const sha256Base64Url = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return arrayBufferToBase64Url(digest)
}

const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const generateKeyPair = () => crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])

const exportPublicKeyBase64Url = async (publicKey: CryptoKey): Promise<string> => {
  const spki = await crypto.subtle.exportKey("spki", publicKey)
  return arrayBufferToBase64Url(spki)
}

const buildRelease = async (privateKey: CryptoKey, overrides: Partial<PresenceRelease> = {}): Promise<PresenceRelease> => {
  const metadata = {
    slug: "test-presence",
    name: "Test Presence",
    author: { name: "tester" },
    description: { "en-US": "test" },
    url: ["https://example.com"],
    color: "#5865F2",
    category: "other" as const,
  }
  const bundle = "console.log('bundle')"
  const sha256 = await sha256Base64Url(bundle)
  const metadataHash = await sha256Base64Url(canonicalJson(metadata))
  const signedAt = new Date().toISOString()

  const signedPayload = canonicalJson({ metadataHash, sha256, signedAt, slug: metadata.slug, version: "1.0.0" })
  const signatureBuffer = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(signedPayload))

  return {
    slug: metadata.slug,
    version: "1.0.0",
    metadata,
    bundle,
    sha256,
    metadataHash,
    signature: arrayBufferToBase64Url(signatureBuffer),
    signedAt,
    ...overrides,
  }
}

describe("verifyPresenceRelease", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in tests")))
  })

  it("rejects a release missing required fields", async () => {
    installChromeMock()
    const { verifyPresenceRelease } = await import("@/background/services/release-security")
    const result = await verifyPresenceRelease({} as PresenceRelease)
    expect(result).toEqual({ ok: false, error: "RELEASE_METADATA_MISSING" })
  })

  it("rejects a release whose bundle hash was tampered with", async () => {
    installChromeMock()
    const { verifyPresenceRelease } = await import("@/background/services/release-security")
    const { privateKey } = await generateKeyPair()
    const release = await buildRelease(privateKey, { bundle: "tampered bundle" })
    const result = await verifyPresenceRelease(release)
    expect(result).toEqual({ ok: false, error: "BUNDLE_HASH_MISMATCH" })
  })

  it("rejects a release whose metadata was tampered with", async () => {
    installChromeMock()
    const { verifyPresenceRelease } = await import("@/background/services/release-security")
    const { privateKey } = await generateKeyPair()
    const release = await buildRelease(privateKey, {
      metadata: {
        slug: "test-presence",
        name: "Tampered",
        author: { name: "x" },
        description: {},
        url: [],
        color: "#000",
        category: "other",
      },
    })
    const result = await verifyPresenceRelease(release)
    expect(result).toEqual({ ok: false, error: "METADATA_HASH_MISMATCH" })
  })

  it("accepts an unsigned release only on a canary build", async () => {
    installChromeMock()
    // Whether an unsigned release is trusted is a build-time channel flag
    // (IS_CANARY), not a runtime manifest check - update_url is Chrome-only
    // and Firefox never sets it even on real store installs, so gating on it
    // used to bypass signature verification for every Firefox user.
    vi.stubEnv("VITE_NOWLY_CHANNEL", "canary")
    const { verifyPresenceRelease } = await import("@/background/services/release-security")
    const { privateKey } = await generateKeyPair()
    const release = await buildRelease(privateKey, { signature: "" })
    expect(await verifyPresenceRelease(release)).toEqual({ ok: true })
  })

  it("rejects an unsigned release on a stable (store) build", async () => {
    installChromeMock()
    vi.stubEnv("VITE_NOWLY_CHANNEL", "stable")
    const { verifyPresenceRelease } = await import("@/background/services/release-security")
    const { privateKey } = await generateKeyPair()
    const release = await buildRelease(privateKey, { signature: "" })
    expect(await verifyPresenceRelease(release)).toEqual({ ok: false, error: "RELEASE_SIGNATURE_MISSING" })
  })

  it("accepts a release signed with the cached public key", async () => {
    const chrome = installChromeMock()
    const { publicKey, privateKey } = await generateKeyPair()
    chrome.local.presenceSigningPublicKey = await exportPublicKeyBase64Url(publicKey)

    const { verifyPresenceRelease } = await import("@/background/services/release-security")
    const release = await buildRelease(privateKey)
    expect(await verifyPresenceRelease(release)).toEqual({ ok: true })
  })

  it("rejects a release signed with a key that doesn't match the cached public key", async () => {
    const chrome = installChromeMock()
    const { publicKey } = await generateKeyPair()
    const { privateKey: wrongPrivateKey } = await generateKeyPair()
    chrome.local.presenceSigningPublicKey = await exportPublicKeyBase64Url(publicKey)

    const { verifyPresenceRelease } = await import("@/background/services/release-security")
    const release = await buildRelease(wrongPrivateKey)
    expect(await verifyPresenceRelease(release)).toEqual({ ok: false, error: "RELEASE_SIGNATURE_INVALID" })
  })
})
