import { serverEnv } from "@nowly/env/server"
import type { FastifyReply, FastifyRequest } from "fastify"
import { createHmac, timingSafeEqual } from "node:crypto"

// Per-device capability token used to authorize destructive operations keyed
// on a deviceId (uninstall cleanup). The token is HMAC-derived from the
// deviceId and only travels on the /devices/sync response and uninstall links.
const tokenSecret = (): string => serverEnv.DEVICE_TOKEN_SECRET ?? serverEnv.JWT_SECRET

export const deriveDeviceToken = (deviceId: string): string =>
  createHmac("sha256", tokenSecret()).update(`device-token:v1:${deviceId}`).digest("base64url")

export const verifyDeviceToken = (deviceId: string, token: string | undefined | null): boolean => {
  if (!deviceId || !token) return false
  const expected = Buffer.from(deriveDeviceToken(deviceId))
  const provided = Buffer.from(token)
  if (expected.length !== provided.length) return false
  return timingSafeEqual(expected, provided)
}

const extractToken = (request: FastifyRequest): string | undefined => {
  const header = request.headers["x-device-token"]
  if (typeof header === "string" && header.trim()) return header.trim()

  const auth = request.headers.authorization
  if (auth?.startsWith("Device ")) return auth.slice("Device ".length).trim()

  const query = (request.query as { token?: unknown } | undefined)?.token
  if (typeof query === "string" && query.trim()) return query.trim()

  return undefined
}

export const requireDeviceAccess = (request: FastifyRequest, reply: FastifyReply, deviceId: string): boolean => {
  if (verifyDeviceToken(deviceId, extractToken(request))) return true
  reply.status(401).send({ error: "INVALID_DEVICE_TOKEN" })
  return false
}
