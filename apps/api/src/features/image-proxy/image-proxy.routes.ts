import { jsonBody } from "@/shared/request-body";
import { Hono } from "hono";
import { createCacheId, fetchImage, getCached, getPublicBaseUrl, handleImageProxyRequest, imageResponse, jsonResponse, parseProxyUrl, setCached, PUBLIC_CORS_HEADERS, CACHED_IMAGE_TTL } from "./image-proxy.service";

const CACHE_ID = /^[a-zA-Z0-9_-]{16,64}$/;

const stringField = (body: unknown, key: string): string | undefined => {
  if (!body || typeof body !== "object" || !(key in body)) return undefined;

  const value: unknown = Reflect.get(body, key);
  return typeof value === "string" ? value : undefined;
};

const hasOnly = (query: Record<string, string>, allowed: string[]): boolean => Object.keys(query).every((key) => allowed.includes(key));

export const imageProxyRoutes = new Hono()
  .options(
    "/images-proxy",
    () =>
      new Response(null, {
        status: 204,
        headers: PUBLIC_CORS_HEADERS
      })
  )
  .post("/images-proxy", async (c) => {
    const body = await jsonBody(c);

    const target = await parseProxyUrl(stringField(body, "url"), stringField(body, "service"));

    if (!target) return jsonResponse({ error: "INVALID_IMAGE_URL" }, 400);

    const id = createCacheId(target.service.id, target.url.href);

    if (!getCached(id)) {
      const image = await fetchImage(target.url, target.service);

      if (!image.ok) return jsonResponse({ error: image.error }, image.status);

      setCached(id, {
        contentType: image.contentType,
        body: image.buffer.toString("base64")
      });
    }

    return jsonResponse({
      url: `${getPublicBaseUrl(c)}/images-proxy/${id}`,
      expiresIn: CACHED_IMAGE_TTL
    });
  })
  .get("/images-proxy/:id", (c) => {
    const id = c.req.param("id");

    if (!CACHE_ID.test(id)) return c.json({ error: "INVALID_IMAGE_ID" }, 400);

    const cached = getCached(id);

    if (!cached) return c.json({ error: "IMAGE_NOT_FOUND" }, 404);

    return imageResponse(
      {
        contentType: cached.contentType,
        buffer: Buffer.from(cached.body, "base64")
      },
      CACHED_IMAGE_TTL
    );
  })
  .get("/i", async (c) => {
    const query = c.req.query();

    if (!hasOnly(query, ["u"])) return c.json({ error: "IMAGE_URL_NOT_ENCODED" }, 400);

    return handleImageProxyRequest({ url: query.u });
  })
  .get("/image-proxy", async (c) => {
    const query = c.req.query();

    if (!hasOnly(query, ["url", "service"])) return c.json({ error: "IMAGE_URL_NOT_ENCODED" }, 400);

    return handleImageProxyRequest({
      url: query.url,
      service: query.service
    });
  });