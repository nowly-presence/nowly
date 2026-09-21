import type { FastifyInstance } from "fastify"
import {
  createCacheId,
  fetchImage,
  getCached,
  getPublicBaseUrl,
  handleImageProxyRequest,
  imageResponse,
  logImageProxyCall,
  parseProxyUrl,
  setCached,
  withPublicCors,
  CACHED_IMAGE_TTL,
} from "./image-proxy.service"

export const imageProxyRoutes = async (fastify: FastifyInstance) => {
  fastify.options("/images-proxy", async (_request, reply) =>
    withPublicCors(reply).status(204).send()
  )

  fastify.post<{ Body: { service?: string; url?: string } }>("/images-proxy", async (request, reply) => {
    const target = await parseProxyUrl(request.body?.url, request.body?.service)
    if (!target) {
       return withPublicCors(reply).status(400).send({ error: "INVALID_IMAGE_URL" })
    }

    logImageProxyCall(target.service)

    const id = createCacheId(target.service.id, target.url.href)
    const existing = getCached(id)
    if (existing) {
      return withPublicCors(reply).send({
        url: `${getPublicBaseUrl(request)}/images-proxy/${id}`,
        expiresIn: CACHED_IMAGE_TTL,
      })
    }

    const image = await fetchImage(target.url, target.service)
    if (!image.ok) {
      return withPublicCors(reply).status(image.status).send({ error: image.error })
    }

    setCached(id, {
      contentType: image.contentType,
      body: image.buffer.toString("base64"),
    })

    return withPublicCors(reply).send({
      url: `${getPublicBaseUrl(request)}/images-proxy/${id}`,
      expiresIn: CACHED_IMAGE_TTL,
    })
  })

  fastify.get<{ Params: { id: string } }>("/images-proxy/:id", async (request, reply) => {
    const { id } = request.params
    if (!/^[a-zA-Z0-9_-]{16,64}$/.test(id)) {
       return reply.status(400).send({ error: "INVALID_IMAGE_ID" })
    }

    const cached = getCached(id)
    if (!cached) {
       return reply.status(404).send({ error: "IMAGE_NOT_FOUND" })
    }

    return imageResponse(reply, {
      contentType: cached.contentType,
      buffer: Buffer.from(cached.body, "base64"),
    }, CACHED_IMAGE_TTL)
  })

  // /i and /image-proxy are the same fetch+stream behaviour with different query param names, kept as aliases for existing consumers.
  fastify.get<{ Querystring: { u?: string; [key: string]: string | undefined } }>("/i", async (request, reply) => {
    const extraParams = Object.keys(request.query).filter((key) => key !== "u")
    if (extraParams.length > 0) {
      return reply.status(400).send({
         error: "IMAGE_URL_NOT_ENCODED",
      })
    }

    return handleImageProxyRequest(request, reply, { url: request.query.u })
  })

  fastify.get<{ Querystring: { url?: string; service?: string; [key: string]: string | undefined } }>("/image-proxy", async (request, reply) => {
    const extraParams = Object.keys(request.query).filter((key) => key !== "url" && key !== "service")
    if (extraParams.length > 0) {
      return reply.status(400).send({
         error: "IMAGE_URL_NOT_ENCODED",
      })
    }

    return handleImageProxyRequest(request, reply, { url: request.query.url, service: request.query.service })
  })
}
