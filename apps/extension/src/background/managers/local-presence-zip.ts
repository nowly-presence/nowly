import { unzipSync, strFromU8 } from "fflate"
import { canonicalJson } from "@nowly/shared"
import { toZipBytes } from "@/shared/zip-bytes"
import type { PresenceMetadata, PresenceRelease } from "@/shared/types"

const MAX_ZIP_BYTES = 5 * 1024 * 1024

const CATEGORIES: PresenceMetadata["category"][] = [
  "streaming",
  "music",
  "video",
  "social",
  "gaming",
  "tools",
  "ai",
  "learning",
  "creator",
  "other",
]

const normalizePath = (path: string): string => path.replace(/\\/g, "/").replace(/^\.\//, "")

const localeText = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    const preferred = record["en-US"] ?? record["fr-FR"] ?? Object.values(record)[0]
    if (typeof preferred === "string" && preferred.trim()) return preferred
  }
  return fallback
}

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
}

export const normalizeLocalMetadata = (raw: unknown, slug: string): PresenceMetadata | null => {
  if (!raw || typeof raw !== "object") return null
  const data = raw as Record<string, unknown>
  const urls = asStringArray(data.url)
  if (urls.length === 0) return null

  const category = CATEGORIES.includes(data.category as PresenceMetadata["category"])
    ? (data.category as PresenceMetadata["category"])
    : "other"

  const authorRaw = data.author
  const authorName =
    authorRaw && typeof authorRaw === "object" && typeof (authorRaw as { name?: unknown }).name === "string"
      ? (authorRaw as { name: string }).name
      : typeof authorRaw === "string"
        ? authorRaw
        : "local"

  return {
    slug,
    name: localeText(data.name, slug),
    author: { name: authorName },
    description:
      typeof data.description === "object" && data.description
        ? (data.description as Record<string, string>)
        : { "en-US": localeText(data.description, slug) },
    url: urls,
    color: typeof data.color === "string" && data.color.length > 0 ? data.color : "#5865F2",
    category,
    version: typeof data.version === "string" ? data.version : null,
    world: data.world === "main" ? "main" : "isolated",
    runAt:
      data.runAt === "document_start" || data.runAt === "document_end" || data.runAt === "document_idle" ? data.runAt : "document_idle",
    ...(typeof data.regExp === "string" ? { regExp: data.regExp } : {}),
    ...(data.longDescription && typeof data.longDescription === "object"
      ? { longDescription: data.longDescription as Record<string, string> }
      : {}),
    ...(data.features && typeof data.features === "object" ? { features: data.features as Record<string, string[]> } : {}),
    ...(data.locales && typeof data.locales === "object" ? { locales: data.locales as Record<string, Record<string, string>> } : {}),
    ...(data.discordNative === true ? { discordNative: true } : {}),
  }
}

const sha256Base64Url = async (input: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  const bytes = new Uint8Array(digest)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const pickMetadataPath = (paths: string[]): string | null => {
  const matches = paths.filter((path) => path.endsWith("metadata.json") && !path.includes("__MACOSX"))
  if (matches.length === 0) return null
  return matches.slice().sort((left, right) => left.split("/").length - right.split("/").length || left.localeCompare(right))[0] ?? null
}

const slugFromPath = (metadataPath: string, fallback: string): string => {
  const parts = normalizePath(metadataPath).split("/").filter(Boolean)
  const parent = parts.length >= 2 ? parts[parts.length - 2] : ""
  if (!parent || parent === "." || parent === "..") return fallback
  return parent.toLowerCase().replace(/\s+/g, "-")
}

const fileLookup = (files: Record<string, Uint8Array>): Map<string, Uint8Array> => {
  const map = new Map<string, Uint8Array>()
  for (const [path, content] of Object.entries(files)) {
    if (!content || content.byteLength === 0) continue
    map.set(normalizePath(path).toLowerCase(), content)
  }
  return map
}

const fileAt = (lookup: Map<string, Uint8Array>, path: string): Uint8Array | undefined => lookup.get(normalizePath(path).toLowerCase())

const findBundle = (lookup: Map<string, Uint8Array>, metadataPath: string): Uint8Array | undefined => {
  const dir = metadataPath.includes("/") ? metadataPath.slice(0, metadataPath.lastIndexOf("/") + 1) : ""
  const sameDir = fileAt(lookup, `${dir}bundle.js`)
  if (sameDir) return sameDir

  const matches = [...lookup.entries()]
    .filter(([path]) => path.endsWith("/bundle.js") || path === "bundle.js")
    .sort((left, right) => left[0].split("/").length - right[0].split("/").length)
  return matches[0]?.[1]
}

const hasSourceScript = (lookup: Map<string, Uint8Array>): boolean =>
  [...lookup.keys()].some((path) => path.endsWith("/presence.ts") || path === "presence.ts")

export const parsePresenceZip = async (
  payload: unknown,
  fileName = "presence.zip",
): Promise<{ ok: true; slug: string; metadata: PresenceMetadata; bundle: string } | { ok: false; error: string }> => {
  const raw = toZipBytes(payload)
  if (!raw) return { ok: false, error: "invalid-zip" }
  if (raw.byteLength === 0 || raw.byteLength > MAX_ZIP_BYTES) return { ok: false, error: "zip-too-large" }
  const bytes = new Uint8Array(raw)

  let files: Record<string, Uint8Array>
  try {
    files = Object.fromEntries(Object.entries(unzipSync(bytes)).map(([path, content]) => [normalizePath(path), content]))
  } catch {
    return { ok: false, error: "invalid-zip" }
  }

  const lookup = fileLookup(files)
  const paths = [...lookup.keys()]
  const metadataPath = pickMetadataPath(paths)
  if (!metadataPath) return { ok: false, error: "metadata-missing" }

  const bundleBytes = findBundle(lookup, metadataPath)
  if (!bundleBytes) {
    return { ok: false, error: hasSourceScript(lookup) ? "source-not-built" : "bundle-missing" }
  }

  const metadataBytes = fileAt(lookup, metadataPath)
  if (!metadataBytes) return { ok: false, error: "metadata-missing" }

  let parsed: unknown
  try {
    parsed = JSON.parse(strFromU8(metadataBytes))
  } catch {
    return { ok: false, error: "metadata-invalid" }
  }

  const fallbackSlug =
    fileName
      .replace(/\.zip$/i, "")
      .toLowerCase()
      .replace(/\s+/g, "-") || "local-presence"
  const rawSlug =
    typeof (parsed as { slug?: unknown }).slug === "string" ? (parsed as { slug: string }).slug : slugFromPath(metadataPath, fallbackSlug)
  const slug = rawSlug.toLowerCase().replace(/\s+/g, "-")
  const metadata = normalizeLocalMetadata({ ...(parsed as object), slug }, slug)
  if (!metadata) return { ok: false, error: "urls-missing" }
  const bundle = strFromU8(bundleBytes).trim()
  if (!bundle) return { ok: false, error: "bundle-empty" }

  return { ok: true, slug, metadata, bundle }
}

export const toLocalRelease = async (slug: string, metadata: PresenceMetadata, bundle: string): Promise<PresenceRelease> => {
  const version = metadata.version && metadata.version.length > 0 ? metadata.version : `0.0.0-dev.${Date.now()}`
  const nextMetadata = { ...metadata, slug, version }
  return {
    slug,
    version,
    metadata: nextMetadata,
    bundle,
    sha256: await sha256Base64Url(bundle),
    metadataHash: await sha256Base64Url(canonicalJson(nextMetadata)),
    signature: "",
    signedAt: new Date().toISOString(),
  }
}
