import { normalizeIP } from "@fastify/rate-limit"
import type { FastifyRequest } from "fastify"

export const deviceRateLimitKey = (request: FastifyRequest): string => {
  const body = request.body as { deviceId?: unknown } | undefined
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim() : ""
  return deviceId || normalizeIP(request.ip)
}
