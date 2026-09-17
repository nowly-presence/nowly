import { hasAdminAuth, requireAuth } from "@/features/auth/auth.middleware"
import { buildLocaleObject } from "@nowly/locales"
import { presenceActiveBodySchema, presencePutBodySchema, presenceReportBodySchema } from "@nowly/shared/schemas"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import {
  addVersion,
  clearActiveDevice, clearActiveDevicesForDevice,
  getAllPresenceSlugs, getGlobalPresenceStats, getPresenceMeta, getPresenceStats, getVersionHistory,
  markActiveDevice,
  setAdded, setUpdated, setVersion,
} from "./presence.repository"
import { buildRelease } from "./presence.service"
import {
  presenceDisplayName,
  sanitizeReportMessage,
  submitPresenceReport,
} from "./presence-report"
import { processPresenceSync, type PresenceSyncBody } from "./presence.sync"

const sendArchivedNotFound = async (
  slug: string,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> => {
  const stats = await getPresenceStats(slug)
  if (!stats?.archived || hasAdminAuth(request)) return false
  reply.status(404).send({ error: "Presence not found" })
  return true
}

export const presenceRoutes = async (fastify: FastifyInstance) => {
  fastify.get("", async (_request, _reply) => {
    const slugs = await getAllPresenceSlugs()
    const results = await Promise.all(slugs.map(async (slug) => {
      const [meta, stats] = await Promise.all([
        getPresenceMeta(slug),
        getPresenceStats(slug),
      ])

      if (!meta) return null

      return {
        ...meta,
        version: stats.version || "",
        totalInstalls: stats.totalInstalls,
        activeUsers: stats.activeUsers,
      }
    }))

    return results.filter((result) => result !== null)
  })

  fastify.get("/stats", async (_request, reply) => {
    const stats = await getGlobalPresenceStats()
    return reply
      .header("Cache-Control", "public, max-age=60, stale-while-revalidate=120")
      .send(stats)
  })

  fastify.get<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    if (await sendArchivedNotFound(slug, request, reply)) return

    const release = await buildRelease(slug)

    if (!release) {
      return reply.status(404).send({ error: "Presence not found" })
    }

    return reply
      .header("Cache-Control", "no-store")
      .send(release)
  })

  fastify.post<{ Params: { slug: string } }>("/:slug/report", {
    config: {
      rateLimit: {
        max: 8,
        timeWindow: "10 minutes",
      },
    },
  }, async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    if (await sendArchivedNotFound(slug, request, reply)) return

    const parsed = presenceReportBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request body" })
    }

    const meta = await getPresenceMeta(slug)
    if (!meta) {
      return reply.status(404).send({ error: "Presence not found" })
    }

    const message = sanitizeReportMessage(parsed.data.message)
    if (!message) {
      return reply.status(400).send({ error: "Invalid request body" })
    }

    const result = await submitPresenceReport({
      slug,
      name: presenceDisplayName(meta, slug, parsed.data.locale),
      message,
      locale: parsed.data.locale,
    })

    if (result === "unconfigured") {
      return reply.status(503).send({ error: "Reports are temporarily unavailable" })
    }
    if (result === "failed") {
      return reply.status(502).send({ error: "Could not send the report" })
    }

    return { ok: true }
  })

  fastify.get<{ Params: { slug: string } }>("/:slug/versions", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    if (await sendArchivedNotFound(slug, request, reply)) return

    const history = await getVersionHistory(slug)
    return reply.send(history)
  })

  fastify.get<{ Params: { slug: string; version: string } }>("/:slug/versions/:version", async (request, reply) => {
    const slug = request.params.slug.toLowerCase()
    const version = request.params.version
    if (await sendArchivedNotFound(slug, request, reply)) return

    const release = await buildRelease(slug, version)

    if (!release) {
      return reply.status(404).send({ error: "Version not found" })
    }

    return reply
      .header("Cache-Control", "no-store")
      .send(release)
  })

  fastify.put<{ Params: { slug: string } }>("/:slug", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const slug = request.params.slug.toLowerCase()
    const parsedBody = presencePutBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({ error: "Invalid request body" })
    }
    const body = parsedBody.data

    if (body.version) {
      await setVersion(slug, body.version)
      if (body.changelog || body.author) {
        await addVersion(slug, {
          version: body.version,
          changelog: body.changelog
            ? JSON.stringify(buildLocaleObject(body.changelog))
            : "",
          author: body.author ?? "unknown",
          authorGithub: body.authorGithub,
          pr: body.pr,
          timestamp: Date.now(),
        })
      }
    }

    if (body.added) await setAdded(slug, body.added)
    if (body.updated) await setUpdated(slug, body.updated)

    return { ok: true }
  })

  fastify.post("/sync", async (request, reply) => {
    await requireAuth(request, reply)
    if (reply.sent) return

    const { results, archived } = await processPresenceSync(request.body as PresenceSyncBody)
    return { ok: true, results, archived }
  })

  fastify.post("/active", async (request, reply) => {
    const parsed = presenceActiveBodySchema.safeParse(request.body)
    if (!parsed.success || !parsed.data.deviceId) {
      return reply.status(400).send({ error: "deviceId is required" })
    }

    const { presences: slugs, deviceId } = parsed.data
    for (const slug of slugs) {
      await markActiveDevice(slug.toLowerCase(), deviceId)
    }

    return { ok: true, count: slugs.length }
  })

  fastify.delete<{ Params: { deviceId: string; slug?: string } }>("/active/:deviceId/:slug?", async (request, _reply) => {
    const deviceId = request.params.deviceId.trim()
    const slug = request.params.slug?.trim()

    if (!deviceId) {
      return { ok: false, error: "deviceId is required" }
    }

    if (slug) {
      await clearActiveDevice(slug, deviceId)
      return { ok: true, removed: 1 }
    }

    await clearActiveDevicesForDevice(deviceId)
    return { ok: true, removed: null }
  })

}

export const register = async (app: FastifyInstance): Promise<void> => {
  await app.register(presenceRoutes, { prefix: "/presences" })
}