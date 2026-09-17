import { generateKeyPairSync } from "node:crypto"
import Fastify from "fastify"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" })
const privateKeyBase64Url = privateKey.export({ format: "der", type: "pkcs8" }).toString("base64url")
const expectedPublicKeyBase64Url = publicKey.export({ format: "der", type: "spki" }).toString("base64url")

describe("security routes", () => {
  beforeEach(() => {
    vi.stubEnv("PRESENCE_SIGNING_PRIVATE_KEY", privateKeyBase64Url)
    vi.resetModules()
  })

  it("GET /public-key derives the public key from the configured private key", async () => {
    const { securityRoutes } = await import("@/features/security/security.routes")
    const app = Fastify()
    await app.register(securityRoutes)

    const res = await app.inject({ method: "GET", url: "/public-key" })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ publicKey: expectedPublicKeyBase64Url })

    await app.close()
  })

  it("caches the derived key across requests", async () => {
    const { securityRoutes } = await import("@/features/security/security.routes")
    const app = Fastify()
    await app.register(securityRoutes)

    const first = await app.inject({ method: "GET", url: "/public-key" })
    const second = await app.inject({ method: "GET", url: "/public-key" })

    expect(first.body).toBe(second.body)

    await app.close()
  })
})
