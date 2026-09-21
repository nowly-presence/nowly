import type { FastifyInstance } from "fastify"
import { fetchAssetFromCdn } from "./assets.service"

export const assetsRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { slug: string; type: string } }>("/:slug/assets/:type", async (request, reply) => {
    const { slug: raw, type } = request.params
    const slug = raw.toLowerCase()

    if (!["logo", "icon", "thumbnail"].includes(type)) {
      return reply.status(400).send({ error: "INVALID_ASSET_TYPE" })
    }

    const asset = await fetchAssetFromCdn(slug, type)
    if (!asset) {
      return reply.status(404).send({ error: "ASSET_NOT_FOUND" })
    }

    return reply
      .header("Content-Type", asset.mime)
      .header("Cache-Control", "public, max-age=31536000, immutable")
      .send(asset.buffer)
  })
}
