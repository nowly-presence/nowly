import { analyticsRoutes, deviceRoutes } from "@/features/analytics/analytics.routes"
import { assetsRoutes } from "@/features/assets/assets.routes"
import { authRoutes } from "@/features/auth/auth.routes"
import { imageProxyRoutes } from "@/features/image-proxy/image-proxy.routes"
import { presenceRoutes } from "@/features/presence/presence.routes"

import { securityRoutes } from "@/features/security/security.routes"
import { statusRoutes } from "@/features/status/status.routes"
import { supportRoutes } from "@/features/support/support.routes"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"
import { serverEnv } from "@nowly/env/server"
import Fastify from "fastify"

const server = Fastify({ logger: true })

await server.register(rateLimit, { max: 100, timeWindow: "1 minute" })

await server.register(cors, {
  origin: serverEnv.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-token", "x-device-token"],
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

await server.register(analyticsRoutes, { prefix: "/analytics" })
await server.register(deviceRoutes, { prefix: "/devices" })
await server.register(authRoutes, { prefix: "/auth" })
await server.register(statusRoutes)
await server.register(imageProxyRoutes)
await server.register(assetsRoutes, { prefix: "/presences" })
await server.register(presenceRoutes, { prefix: "/presences" })

await server.register(securityRoutes, { prefix: "/security" })
await server.register(supportRoutes)

const port = serverEnv.PORT

try {
  await server.listen({ port, host: "0.0.0.0" })
  console.log(`API running on port ${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
