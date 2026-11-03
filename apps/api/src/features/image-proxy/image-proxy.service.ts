import { hasDatabase } from "@/db/client";
import { getAllPresenceMetas } from "@/features/presence/presence.repository";
import { createHash } from "crypto";
import type { Context } from "hono";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8_000;
const CACHED_IMAGE_TTL_SECONDS = 5 * 60;
const CACHED_IMAGE_STALE_SECONDS = 60;
const PUBLIC_IMAGE_PROXY_ORIGIN = "*";
const PRESENCE_SERVICES_TTL_MS = 5 * 60 * 1000;
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const FALLBACK_IMAGE_TYPE = "image/webp";
const SCRIPTABLE_IMAGE_TYPES = new Set(["image/svg+xml"]);

export type ImageProxyService = {
  id: string;
  hostSuffixes: string[];
  headers?: HeadersInit;
};

type CachedImage = {
  contentType: string;
  body: string;
  expiresAt: number;
};

const cache = new Map<string, CachedImage>();

let presenceServicesCache: {
  services: ImageProxyService[];
  expiresAt: number;
} | null = null;

const getPresenceServices = async (): Promise<ImageProxyService[]> => {
  if (!hasDatabase()) return [];
  if (presenceServicesCache && presenceServicesCache.expiresAt > Date.now()) {
    return presenceServicesCache.services;
  }

  const metas = await getAllPresenceMetas();

  const services: ImageProxyService[] = [];

  for (const { slug, metadata } of metas) {
    const config = metadata?.imageProxy as
      | {
          hostSuffixes?: string[];
          headers?: Record<string, string>;
        }
      | undefined;

    if (config?.hostSuffixes?.length) {
      services.push({
        id: slug,
        hostSuffixes: config.hostSuffixes,
        headers: config.headers
      });
    }
  }

  presenceServicesCache = {
    services,
    expiresAt: Date.now() + PRESENCE_SERVICES_TTL_MS
  };
  return services;
};

const matchesHostSuffix = (hostname: string, suffixes: string[]): boolean =>
  suffixes.some((raw) => {
    const suffix = typeof raw === "string" ? raw.trim().toLowerCase().replace(/^\.+/, "") : "";
    return suffix !== "" && (hostname === suffix || hostname.endsWith(`.${suffix}`));
  });

const isAllowedImageUrl = (url: URL, service: ImageProxyService): boolean =>
  url.protocol === "https:" && matchesHostSuffix(url.hostname.toLowerCase(), service.hostSuffixes);

const resolveRedirect = (location: string | null, base: URL): URL | null => {
  if (!location) return null;

  try {
    return new URL(location, base);
  } catch {
    return null;
  }
};

export const parseProxyUrl = async (url?: string, serviceId?: string): Promise<{
  url: URL;
  service: ImageProxyService;
} | null> => {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    const services = await getPresenceServices();

    const matchedService = serviceId
      ? services.find((s) => s.id === serviceId)
      : services.find((s) => isAllowedImageUrl(parsed, s));

    return matchedService && isAllowedImageUrl(parsed, matchedService) ? { url: parsed, service: matchedService } : null;
  } catch {
    return null;
  }
};

export const createCacheId = (serviceId: string, href: string): string => createHash("sha256").update(`${serviceId}:${href}`).digest("base64url").slice(0, 32);

export const getCached = (id: string): CachedImage | undefined => {
  const cached = cache.get(id);

  if (!cached) return undefined;
  if (Date.now() >= cached.expiresAt) {
    cache.delete(id);
    return undefined;
  }

  return cached;
};

export const setCached = (id: string, image: Omit<CachedImage, "expiresAt">): void => {
  const expiresAt = Date.now() + CACHED_IMAGE_TTL_SECONDS * 1000;
  cache.set(id, { ...image, expiresAt });
  setTimeout(() => {
    if (cache.get(id)?.expiresAt === expiresAt) cache.delete(id);
  }, CACHED_IMAGE_STALE_SECONDS * 1000);
};

export const PUBLIC_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": PUBLIC_IMAGE_PROXY_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...PUBLIC_CORS_HEADERS,
      "Content-Type": "application/json"
    }
  });

export const imageResponse = (
  image: {
    contentType: string;
    buffer: Buffer;
  },
  maxAge?: number
): Response =>
  new Response(new Uint8Array(image.buffer), {
    status: 200,
    headers: {
      ...PUBLIC_CORS_HEADERS,
      "Content-Type": image.contentType,
      "Content-Length": String(image.buffer.byteLength),
      "Cache-Control": `public, max-age=${Math.max(0, maxAge ?? CACHED_IMAGE_TTL_SECONDS)}`,
      "X-Content-Type-Options": "nosniff"
    }
  });

const requestImage = (url: URL, service: ImageProxyService, signal: AbortSignal): Promise<Response> =>
  fetch(url.href, {
    signal,
    headers: service.headers ?? { "User-Agent": "Nowly/1.0" },
    redirect: "manual"
  });

const isServableImageType = (contentType: string): boolean => {
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  return mediaType.startsWith("image/") && !SCRIPTABLE_IMAGE_TYPES.has(mediaType);
};

const readImageBody = async (response: Response): Promise<Buffer | null> => {
  const declaredLength = Number(response.headers.get("Content-Length") ?? 0);

  if (declaredLength > MAX_IMAGE_BYTES) {
    await response.body?.cancel();
    return null;
  }

  if (!response.body) return Buffer.alloc(0);

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
    received += chunk.value.byteLength;

    if (received > MAX_IMAGE_BYTES) {
      await reader.cancel();
      return null;
    }

    chunks.push(chunk.value);
  }

  return Buffer.concat(chunks, received);
};

export const fetchImage = async (url: URL, service: ImageProxyService): Promise<
  | {
      ok: true;
      buffer: Buffer;
      contentType: string;
      status: number;
    }
  | {
      ok: false;
      status: number;
      error: string;
    }
> => {
  if (!isAllowedImageUrl(url, service)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_IMAGE_URL"
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let target = url;
    let response = await requestImage(target, service, controller.signal);

    for (let redirects = 0; REDIRECT_STATUSES.has(response.status); redirects++) {
      const next = resolveRedirect(response.headers.get("Location"), target);
      await response.body?.cancel();

      if (!next || redirects >= MAX_REDIRECTS || !isAllowedImageUrl(next, service)) {
        return {
          ok: false,
          status: 502,
          error: "IMAGE_REDIRECT_REJECTED"
        };
      }

      target = next;
      response = await requestImage(target, service, controller.signal);
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: "IMAGE_UPSTREAM_ERROR"
      };
    }

    const contentType = response.headers.get("Content-Type") || FALLBACK_IMAGE_TYPE;

    if (!isServableImageType(contentType)) {
      await response.body?.cancel();
      return {
        ok: false,
        status: 502,
        error: "IMAGE_UNSUPPORTED_TYPE"
      };
    }

    const buffer = await readImageBody(response);

    if (!buffer) {
      return {
        ok: false,
        status: 413,
        error: "IMAGE_TOO_LARGE"
      };
    }

    if (buffer.byteLength === 0) {
      return {
        ok: false,
        status: 502,
        error: "EMPTY_IMAGE"
      };
    }

    return {
      ok: true,
      buffer,
      contentType,
      status: response.status
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: 504,
        error: "IMAGE_FETCH_TIMEOUT"
      };
    }

    return {
      ok: false,
      status: 502,
      error: "IMAGE_FETCH_FAILED"
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const getPublicBaseUrl = (c: Context): string => process.env.PUBLIC_URL || new URL(c.req.url).origin;

export const CACHED_IMAGE_TTL = CACHED_IMAGE_TTL_SECONDS;

export const handleImageProxyRequest = async (target: {
  url?: string;
  service?: string;
}): Promise<Response> => {
  const parsed = await parseProxyUrl(target.url, target.service);

  if (!parsed) return jsonResponse({ error: "INVALID_IMAGE_URL" }, 400);

  const image = await fetchImage(parsed.url, parsed.service);

  if (!image.ok) return jsonResponse({ error: image.error }, image.status);

  return imageResponse(image);
};