import { canonicalJson } from "@nowly/shared"
import { API_BASE_URL } from "@/shared/constants"
import type { PresenceRelease } from "@/shared/types"

const IS_UNPACKED = (): boolean => {
  try {
    return !chrome.runtime.getManifest().update_url
  } catch {
    return false
  }
}

const FALLBACK_PRESENCE_SIGNING_PUBLIC_KEY =
  "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE5ai7_TuIx7BJF-wAGWidRzj8EVf0OxL-QUp8Ta2m-L91HRVljUTwYfF_ijWVyGF3-5gQvQ4GsQGiSVDknDe_LA"

const STORAGE_KEY = "presenceSigningPublicKey"

let cachedRemoteKey: string | null = null

const base64UrlToArrayBuffer = (value: string): ArrayBuffer => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
  const binary = atob(padded)
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return buffer
}

const sha256Base64Url = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  const bytes = new Uint8Array(digest)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const signedPayload = (release: PresenceRelease): string =>
  canonicalJson({
    metadataHash: release.metadataHash,
    sha256: release.sha256,
    signedAt: release.signedAt,
    slug: release.slug,
    version: release.version,
  })

const fetchPublicKey = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/security/public-key`)
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (data && typeof data === "object" && "publicKey" in data && typeof data.publicKey === "string") {
      await chrome.storage.local.set({ [STORAGE_KEY]: data.publicKey })
      cachedRemoteKey = data.publicKey
      return data.publicKey
    }
  } catch {
    /* fallback */
  }
  return null
}

const ensurePublicKey = async (refresh = false): Promise<string> => {
  // Prefer memory, then persisted storage, and only contact the API as a last
  // resort. This keeps verification available during temporary API outages.
  if (cachedRemoteKey && !refresh) return cachedRemoteKey

  if (!refresh) {
    try {
      const stored: Record<string, unknown> = await chrome.storage.local.get(STORAGE_KEY)
      const value = stored[STORAGE_KEY]
      if (typeof value === "string") {
        cachedRemoteKey = value
        return cachedRemoteKey
      }
    } catch {
      // fall through to remote fetch
    }
  }

  const remote = await fetchPublicKey()
  return remote ?? FALLBACK_PRESENCE_SIGNING_PUBLIC_KEY
}

const verifyWithKey = async (keyB64: string, release: PresenceRelease): Promise<boolean> => {
  try {
    const key = await crypto.subtle.importKey("spki", base64UrlToArrayBuffer(keyB64), { name: "ECDSA", namedCurve: "P-256" }, false, [
      "verify",
    ])

    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      base64UrlToArrayBuffer(release.signature),
      new TextEncoder().encode(signedPayload(release)),
    )
  } catch {
    return false
  }
}

const verifySignature = async (release: PresenceRelease): Promise<boolean> => {
  // Key rotation is intentionally fail-closed: try the cached/current key,
  // then the bundled fallback, and refresh once before rejecting the release.
  const primaryKey = await ensurePublicKey()

  if (await verifyWithKey(primaryKey, release)) return true

  if (primaryKey !== FALLBACK_PRESENCE_SIGNING_PUBLIC_KEY) {
    return verifyWithKey(FALLBACK_PRESENCE_SIGNING_PUBLIC_KEY, release)
  }

  const refreshedKey = await ensurePublicKey(true)
  if (refreshedKey !== primaryKey) {
    return verifyWithKey(refreshedKey, release)
  }

  return false
}

export const verifyPresenceRelease = async (release: PresenceRelease, expectedSlug?: string): Promise<{ ok: boolean; error?: string }> => {
  if (!release || typeof release !== "object") return { ok: false, error: "RELEASE_MISSING" }
  if (!release.metadata || typeof release.metadata !== "object") return { ok: false, error: "RELEASE_METADATA_MISSING" }
  if (typeof release.slug !== "string") return { ok: false, error: "RELEASE_SLUG_MISSING" }
  if (typeof release.version !== "string") return { ok: false, error: "RELEASE_VERSION_MISSING" }
  if (typeof release.sha256 !== "string") return { ok: false, error: "RELEASE_HASH_MISSING" }
  if (typeof release.metadataHash !== "string") return { ok: false, error: "RELEASE_METADATA_HASH_MISSING" }
  if (typeof release.signature !== "string") return { ok: false, error: "RELEASE_SIGNATURE_MISSING" }
  if (typeof release.signedAt !== "string") return { ok: false, error: "RELEASE_SIGNED_AT_MISSING" }
  if (expectedSlug && release.slug !== expectedSlug) return { ok: false, error: "RELEASE_SLUG_MISMATCH" }
  if (release.metadata.slug !== release.slug) return { ok: false, error: "METADATA_SLUG_MISMATCH" }
  if (!release.bundle?.trim()) return { ok: false, error: "RELEASE_BUNDLE_MISSING" }

  const bundleHash = await sha256Base64Url(release.bundle)
  if (bundleHash !== release.sha256) return { ok: false, error: "BUNDLE_HASH_MISMATCH" }

  const metadataHash = await sha256Base64Url(canonicalJson(release.metadata))
  if (metadataHash !== release.metadataHash) return { ok: false, error: "METADATA_HASH_MISMATCH" }

  if (release.signature) {
    if (!(await verifySignature(release))) return { ok: false, error: "RELEASE_SIGNATURE_INVALID" }
    return { ok: true }
  }

  if (IS_UNPACKED()) return { ok: true }
  return { ok: false, error: "RELEASE_SIGNATURE_MISSING" }
}
