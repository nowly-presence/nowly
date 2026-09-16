import { serverEnv } from "@nowly/env/server"
import type { FastifyReply, FastifyRequest } from "fastify"
import { createHmac, timingSafeEqual } from "node:crypto"

// Per-device capability token used to authorize the destructive / data-export
// operations that are keyed on a deviceId. The deviceId alone leaks easily (it
// travels in analytics payloads, the /consent and /uninstall URLs, referrers
// and logs), so on its own it is a weak authorization secret. The token is
// HMAC-derived from the deviceId and only ever travels on the /devices/sync
// response and inside the consent/uninstall links - never in analytics events -
// which shrinks the surface from which it can leak.
//
// Trade-off (intentional, see device-token discussion): because the token is
// deterministically derivable from (secret, deviceId), `/devices/sync` returns
// it for any deviceId. This keeps the rollout migration-free - every existing
// device receives its token on the next sync with no DB change. A stronger
// design would store a random per-device secret in the database; revisit if the
// data handled here becomes more sensitive.
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
  reply.status(401).send({ error: "Invalid or missing device token" })
  return false
}