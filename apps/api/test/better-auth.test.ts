import { beforeEach, describe, expect, it, vi } from "vitest"

describe("getAuth", () => {
  beforeEach(() => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
    vi.stubEnv("BETTER_AUTH_SECRET", "test-better-auth-secret")
    vi.resetModules()
  })

  it("configures without touching the network and registers the discord provider", async () => {
    const { getAuth } = await import("@/features/auth/better-auth")
    const auth = getAuth()

    expect(auth.options.socialProviders?.discord).toBeDefined()
    expect(auth.options.user?.additionalFields?.role).toMatchObject({ type: "string", defaultValue: "user" })
    expect(auth.options.user?.additionalFields?.discordId).toMatchObject({ type: "string", required: false, input: false })
  })

  it("maps the Discord profile id to discordId", async () => {
    const { getAuth } = await import("@/features/auth/better-auth")
    const discord = getAuth().options.socialProviders?.discord
    const mapped = await discord?.mapProfileToUser?.({ id: "1234" } as Parameters<NonNullable<NonNullable<typeof discord>["mapProfileToUser"]>>[0])
    expect(mapped).toEqual({ discordId: "1234" })
  })

  it("trusts local web origins outside production only", async () => {
    const { authTrustedOrigins } = await import("@/features/auth/better-auth")
    expect(authTrustedOrigins()).toContain("http://localhost:3000")
    vi.stubEnv("NODE_ENV", "production")
    expect(authTrustedOrigins()).not.toContain("http://localhost:3000")
    vi.unstubAllEnvs()
  })

  it("is a singleton", async () => {
    const { getAuth } = await import("@/features/auth/better-auth")
    expect(getAuth()).toBe(getAuth())
  })
})
