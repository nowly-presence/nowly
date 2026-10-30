import { hasDatabase } from "@/db/client";
import { getAllPresenceMetas } from "@/features/presence/presence.repository";
import { createHash } from "crypto";
import type { FastifyReply, FastifyRequest } from "fastify";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8_000;
const CACHED_IMAGE_TTL_SECONDS = 5 * 60;
const CACHED_IMAGE_STALE_SECONDS = 60;
const PUBLIC_IMAGE_PROXY_ORIGIN = "*";
const PRESENCE_SERVICES_TTL_MS = 5 * 60 * 1000;
const MAX_REDIRECTS = 3;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

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

export const withPublicCors = (reply: FastifyReply): FastifyReply =>
  reply
    .header("Access-Control-Allow-Origin", PUBLIC_IMAGE_PROXY_ORIGIN)
    .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    .header("Access-Control-Allow-Headers", "Content-Type");

export const imageResponse = (reply: FastifyReply, image: {
  contentType: string;
  buffer: Buffer;
}, maxAge?: number): void => {
  const headers: Record<string, string> = {
    "Content-Type": image.contentType,
    "Content-Length": String(image.buffer.byteLength),
    "Cache-Control": `public, max-age=${Math.max(0, maxAge ?? CACHED_IMAGE_TTL_SECONDS)}`,
    "X-Content-Type-Options": "nosniff"
  };

  withPublicCors(reply).headers(headers).send(image.buffer);
};

const requestImage = (url: URL, service: ImageProxyService, signal: AbortSignal): Promise<Response> =>
  fetch(url.href, {
    signal,
    headers: service.headers ?? { "User-Agent": "Nowly/1.0" },
    redirect: "manual"
  });

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

    const buffer = await readImageBody(response);

    const contentType = response.headers.get("Content-Type") || "image/webp";

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

export const getPublicBaseUrl = (request: FastifyRequest): string =>
  process.env.PUBLIC_URL || `${request.protocol}://${request.hostname}${request.port ? `:${request.port}` : ""}`;

export const CACHED_IMAGE_TTL = CACHED_IMAGE_TTL_SECONDS;

export const handleImageProxyRequest = async (request: FastifyRequest, reply: FastifyReply, target: {
  url?: string;
  service?: string;
}): Promise<void> => {
  const parsed = await parseProxyUrl(target.url, target.service);

  if (!parsed) {
    reply.status(400).send({ error: "INVALID_IMAGE_URL" });
    return;
  }

  const image = await fetchImage(parsed.url, parsed.service);

  if (!image.ok) {
    reply.status(image.status).send({ error: image.error });
    return;
  }

  imageResponse(reply, image);
};