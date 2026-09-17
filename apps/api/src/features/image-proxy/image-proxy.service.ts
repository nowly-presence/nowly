import { createHash } from "crypto"
import type { FastifyReply, FastifyRequest } from "fastify"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000
const CACHED_IMAGE_TTL_SECONDS = 5 * 60
const CACHED_IMAGE_STALE_SECONDS = 60
const PUBLIC_IMAGE_PROXY_ORIGIN = "*"

export type ImageProxyService = {
  id: string
  hostSuffixes: string[]
  headers?: HeadersInit
}

type CachedImage = {
  contentType: string
  body: string
  expiresAt: number
}

// ponytail: in-process Map cache, no Redis. Fine for a single instance; swap for a shared cache if the API scales horizontally.
const cache = new Map<string, CachedImage>()

const services: ImageProxyService[] = [
  {
    id: "youtube",
    hostSuffixes: ["ytimg.com", "ggpht.com", "youtube.com", "googleusercontent.com"],
    headers: { "User-Agent": "Nowly/1.0" },
  },
  {
    id: "twitch",
    hostSuffixes: ["twitch.tv", "ttvnw.net", "jtvnw.net"],
  },
  {
    id: "disney",
    hostSuffixes: ["disney.com", "disney-plus.net", "dssott.com", "bamgrid.com", "disneystreaming.com"],
  },
  {
    id: "netflix",
    hostSuffixes: ["netflix.com", "nflxvideo.net", "nflximg.net", "nflxext.com", "nflxso.net"],
  },
  {
    id: "prime",
    hostSuffixes: ["primevideo.com", "amazon.com", "amazonaws.com", "amazonvideo.com", "media-amazon.com"],
  },
  {
    id: "apple",
    hostSuffixes: ["apple.com", "tv.apple.com"],
  },
  {
    id: "github",
    hostSuffixes: [
      "github.com",
      "github.blog",
      "githubassets.com",
      "githubusercontent.com",
      "githubnext.com",
      "githubuniverse.com",
    ],
    headers: { "User-Agent": "Nowly/1.0" },
  },
  {
    id: "tiktok",
    hostSuffixes: ["tiktokcdn.com", "tiktokcdn-eu.com", "tiktokcdn-us.com", "tiktokv.com"],
    headers: { Referer: "https://www.tiktok.com/" },
  },
  {
    id: "canalplus",
    hostSuffixes: ["thumb.canalplus.pro"],
    headers: { Referer: "https://www.canalplus.com/" },
  },
  {
    id: "generic",
    hostSuffixes: [],
  },
]

export const parseProxyUrl = (url?: string, serviceId?: string): { url: URL; service: ImageProxyService } | null => {
  if (!url?.trim()) return null

  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null

    const matchedService = serviceId
      ? services.find((s) => s.id === serviceId)
      : services.find((s) => s.hostSuffixes.some((suffix) => parsed.hostname.endsWith(suffix)))

    if (!matchedService) return null
    return { url: parsed, service: matchedService }
  } catch { return null }
}

export const createCacheId = (serviceId: string, href: string): string =>
  createHash("sha256").update(`${serviceId}:${href}`).digest("base64url").slice(0, 32)

export const getCached = (id: string): CachedImage | undefined => {
  const cached = cache.get(id)
  if (!cached) return undefined
  if (Date.now() >= cached.expiresAt) {
    cache.delete(id)
    return undefined
  }
  return cached
}

export const setCached = (id: string, image: Omit<CachedImage, "expiresAt">): void => {
  const expiresAt = Date.now() + CACHED_IMAGE_TTL_SECONDS * 1000
  cache.set(id, { ...image, expiresAt })
  setTimeout(() => { if (cache.get(id)?.expiresAt === expiresAt) cache.delete(id) }, CACHED_IMAGE_STALE_SECONDS * 1000)
}

export const withPublicCors = (reply: FastifyReply): FastifyReply =>
  reply.header("Access-Control-Allow-Origin", PUBLIC_IMAGE_PROXY_ORIGIN)

export const imageResponse = (
  reply: FastifyReply,
  image: { contentType: string; buffer: Buffer },
  maxAge?: number,
): void => {
  const headers: Record<string, string> = {
    "Content-Type": image.contentType,
    "Content-Length": String(image.buffer.byteLength),
    "Cache-Control": `public, max-age=${Math.max(0, maxAge ?? CACHED_IMAGE_TTL_SECONDS)}`,
    "X-Content-Type-Options": "nosniff",
  }

  withPublicCors(reply).headers(headers).send(image.buffer)
}

export const fetchImage = async (url: URL, service: ImageProxyService): Promise<
  { ok: true; buffer: Buffer; contentType: string; status: number } |
  { ok: false; status: number; error: string }
> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url.href, {
      signal: controller.signal,
      headers: service.headers ?? { "User-Agent": "Nowly/1.0" },
      redirect: "follow",
      size: MAX_IMAGE_BYTES,
    } as RequestInit)

    if (!response.ok) {
      return { ok: false, status: response.status, error: `Upstream returned ${response.status}` }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get("Content-Type") || "image/webp"

    if (response.headers.has("Content-Length") && buffer.byteLength > MAX_IMAGE_BYTES) {
      return { ok: false, status: 413, error: "Image too large" }
    }

    if (buffer.byteLength === 0) {
      return { ok: false, status: 502, error: "Empty image" }
    }

    return { ok: true, buffer, contentType, status: response.status }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, status: 504, error: "Fetch timeout" }
    }
    return { ok: false, status: 502, error: "Fetch failed" }
  } finally {
    clearTimeout(timeout)
  }
}

export const getPublicBaseUrl = (request: FastifyRequest): string =>
  process.env.PUBLIC_URL || `${request.protocol}://${request.hostname}${request.port ? `:${request.port}` : ""}`

export const CACHED_IMAGE_TTL = CACHED_IMAGE_TTL_SECONDS

export const handleImageProxyRequest = async (
  request: FastifyRequest,
  reply: FastifyReply,
  target: { url?: string; service?: string },
): Promise<void> => {
  const parsed = parseProxyUrl(target.url, target.service)
  if (!parsed) {
    reply.status(400).send({ error: "Invalid image URL" })
    return
  }

  const image = await fetchImage(parsed.url, parsed.service)
  if (!image.ok) {
    reply.status(image.status).send({ error: image.error })
    return
  }

  imageResponse(reply, image)
}
