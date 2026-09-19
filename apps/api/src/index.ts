import { assetsRoutes } from "@/features/assets/assets.routes"
import { getAuth } from "@/features/auth/better-auth"
import { campaignsRoutes } from "@/features/campaigns/campaigns.routes"
import { deviceRoutes } from "@/features/device/device.routes"
import { imageProxyRoutes } from "@/features/image-proxy/image-proxy.routes"
import { insightsRoutes } from "@/features/insights/insights.routes"
import { presenceRoutes } from "@/features/presence/presence.routes"

import { securityRoutes } from "@/features/security/security.routes"
import { statusRoutes } from "@/features/status/status.routes"
import { ApiError } from "@/shared/errors"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"
import { serverEnv } from "@nowly/env/server"
import { toNodeHandler } from "better-auth/node"
import Fastify from "fastify"

const server = Fastify({ logger: true })

await server.register(rateLimit, { max: 100, timeWindow: "1 minute" })

const allowedOrigins = [serverEnv.FRONTEND_URL, serverEnv.INSIGHTS_URL]

const isAllowedOrigin = (origin: string | undefined): boolean =>
  !origin || allowedOrigins.includes(origin) || origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")

await server.register(cors, {
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-token", "x-device-token"],
  credentials: true,
})

server.get("/health", async () => {
  return {
    ok: true,
    service: "nowly-api",
    checkedAt: new Date().toISOString(),
  }
})

server.get("/robots.txt", async (_request, reply) => {
  reply.type("text/plain")
  return "User-agent: *\nDisallow: /\n"
})

server.setErrorHandler((error, _request, reply) => {
  if (error instanceof ApiError) {
    reply.status(error.status).send({ error: error.message })
    return
  }
  server.log.error(error)
  reply.status(500).send({ error: "Internal server error" })
})

// Scoped instance so this content-type parser override (needed because Better
// Auth reads the raw request body itself) doesn't leak to the other routes.
await server.register(async (instance) => {
  instance.addContentTypeParser("application/json", (_request, _payload, done) => done(null))
  instance.all("/auth/*", async (request, reply) => {
    // toNodeHandler writes straight to reply.raw, bypassing Fastify's reply
    // pipeline - @fastify/cors sets headers via reply.header(), which only
    // gets flushed on reply.send(). Set them on the raw response ourselves.
    const origin = request.headers.origin
    if (isAllowedOrigin(origin)) {
      reply.raw.setHeader("Access-Control-Allow-Origin", origin ?? "*")
      reply.raw.setHeader("Access-Control-Allow-Credentials", "true")
      reply.raw.setHeader("Vary", "Origin")
    }
    await toNodeHandler(getAuth())(request.raw, reply.raw)
  })
})

await server.register(insightsRoutes, { prefix: "/insights" })
await server.register(campaignsRoutes, { prefix: "/campaigns" })
await server.register(deviceRoutes, { prefix: "/devices" })
await server.register(statusRoutes)
await server.register(imageProxyRoutes)
await server.register(assetsRoutes, { prefix: "/presences" })
await server.register(presenceRoutes, { prefix: "/presences" })

await server.register(securityRoutes, { prefix: "/security" })

const port = serverEnv.PORT

try {
  await server.listen({ port, host: "0.0.0.0" })
  console.log(`API running on port ${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
