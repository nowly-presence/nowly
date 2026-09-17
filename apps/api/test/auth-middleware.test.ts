import Fastify from "fastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("requireAuth", () => {
  beforeEach(() => {
    delete process.env.API_SECRET_KEY
  })

  afterEach(() => {
    delete process.env.API_SECRET_KEY
    vi.unstubAllEnvs()
  })

  it("returns 500 in production when API_SECRET_KEY is missing, instead of bypassing auth", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const { requireAuth } = await import("@/features/auth/auth.middleware")
    const app = Fastify()
    app.post("/protected", { preHandler: requireAuth }, async () => ({ ok: true }))

    const res = await app.inject({ method: "POST", url: "/protected" })

    expect(res.statusCode).toBe(500)
    await app.close()
  })

  it("bypasses auth outside production when API_SECRET_KEY is missing (dev convenience)", async () => {
    vi.stubEnv("NODE_ENV", "test")
    const { requireAuth } = await import("@/features/auth/auth.middleware")
    const app = Fastify()
    app.post("/protected", { preHandler: requireAuth }, async () => ({ ok: true }))

    const res = await app.inject({ method: "POST", url: "/protected" })

    expect(res.statusCode).toBe(200)
    await app.close()
  })

  it("rejects a request without the correct bearer token when a secret is configured", async () => {
    process.env.API_SECRET_KEY = "test-secret"
    const { requireAuth } = await import("@/features/auth/auth.middleware")
    const app = Fastify()
    app.post("/protected", { preHandler: requireAuth }, async () => ({ ok: true }))

    const res = await app.inject({ method: "POST", url: "/protected" })

    expect(res.statusCode).toBe(401)
    await app.close()
  })

  it("allows a request with the correct bearer token", async () => {
    process.env.API_SECRET_KEY = "test-secret"
    const { requireAuth } = await import("@/features/auth/auth.middleware")
    const app = Fastify()
    app.post("/protected", { preHandler: requireAuth }, async () => ({ ok: true }))

    const res = await app.inject({
      method: "POST",
      url: "/protected",
      headers: { authorization: "Bearer test-secret" },
    })

    expect(res.statusCode).toBe(200)
    await app.close()
  })
})
