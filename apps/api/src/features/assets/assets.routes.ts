import type { FastifyInstance } from "fastify"

const CDN_BASE_URL = "https://cdn.nowly.me"
const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
}

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(assetsRoutes, { prefix: "/presences" })
}

export const assetsRoutes = async (fastify: FastifyInstance) => {
  fastify.get<{ Params: { slug: string; type: string } }>("/:slug/assets/:type", async (request, reply) => {
    const { slug: raw, type } = request.params
    const slug = raw.toLowerCase()

    if (!["logo", "icon", "thumbnail"].includes(type)) {
      return reply.status(400).send({ error: "Invalid asset type" })
    }

    const allowed = ["png", "jpg", "jpeg"]

    for (const ext of allowed) {
      const url = `${CDN_BASE_URL}/presences/${slug}/assets/${type}.${ext}`
      try {
        const res = await fetch(url)
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          const mime = MIME_TYPES[ext] ?? "application/octet-stream"
          return reply
            .header("Content-Type", mime)
            .header("Cache-Control", "public, max-age=31536000, immutable")
            .send(Buffer.from(buffer))
        }
      } catch {}
    }

    return reply.status(404).send({ error: "Asset not found" })
  })
}
