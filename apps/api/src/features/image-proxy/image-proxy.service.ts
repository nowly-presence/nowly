import { getPrisma, hasDatabase } from "@/db/client"
import { getAllPresenceMetas } from "@/features/presence/presence.repository"
import { createHash, randomUUID } from "crypto"
import type { FastifyReply, FastifyRequest } from "fastify"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FETCH_TIMEOUT_MS = 8_000
const CACHED_IMAGE_TTL_SECONDS = 5 * 60
const CACHED_IMAGE_STALE_SECONDS = 60
const PUBLIC_IMAGE_PROXY_ORIGIN = "*"
const PRESENCE_SERVICES_TTL_MS = 5 * 60 * 1000

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

const cache = new Map<string, CachedImage>()

let presenceServicesCache: { services: ImageProxyService[]; expiresAt: number } | null = null

const getPresenceServices = async (): Promise<ImageProxyService[]> => {
  if (!hasDatabase()) return []
  if (presenceServicesCache && presenceServicesCache.expiresAt > Date.now()) {
    return presenceServicesCache.services
  }

  const metas = await getAllPresenceMetas()
  const services: ImageProxyService[] = []
  for (const { slug, metadata } of metas) {
    const config = metadata?.imageProxy as { hostSuffixes?: string[]; headers?: Record<string, string> } | undefined
    if (config?.hostSuffixes?.length) {
      services.push({ id: slug, hostSuffixes: config.hostSuffixes, headers: config.headers })
    }
  }

  presenceServicesCache = { services, expiresAt: Date.now() + PRESENCE_SERVICES_TTL_MS }
  return services
}

export const parseProxyUrl = async (url?: string, serviceId?: string): Promise<{ url: URL; service: ImageProxyService } | null> => {
  if (!url?.trim()) return null

  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null

    const services = await getPresenceServices()
    const matchedService = serviceId
      ? services.find((s) => s.id === serviceId)
      : services.find((s) => s.hostSuffixes.some((suffix) => parsed.hostname.endsWith(suffix)))

    return matchedService ? { url: parsed, service: matchedService } : null
  } catch { return null }
}

export const logImageProxyCall = (service: ImageProxyService): void => {
  if (!hasDatabase()) return

  try {
    void getPrisma().analyticsEvent.create({
      data: {
        eventId: randomUUID(),
        key: "image_proxy_call",
        slug: service.id,
        payload: {},
        createdAt: new Date(),
      },
    }).catch(() => {})
  } catch {}
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
  const parsed = await parseProxyUrl(target.url, target.service)
  if (!parsed) {
    reply.status(400).send({ error: "Invalid image URL" })
    return
  }

  logImageProxyCall(parsed.service)

  const image = await fetchImage(parsed.url, parsed.service)
  if (!image.ok) {
    reply.status(image.status).send({ error: image.error })
    return
  }

  imageResponse(reply, image)
}
