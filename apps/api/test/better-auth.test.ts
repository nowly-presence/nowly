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
  })

  it("is a singleton", async () => {
    const { getAuth } = await import("@/features/auth/better-auth")
    expect(getAuth()).toBe(getAuth())
  })
})
