import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

let authModule: typeof import("@/features/auth/better-auth");

describe("getAuth", () => {
  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/db");
    vi.stubEnv("BETTER_AUTH_SECRET", "test-better-auth-secret");
    authModule = await import("@/features/auth/better-auth");
    authModule.getAuth();
  });

  afterEach(vi.unstubAllEnvs);

  it("configures without touching the network and registers the discord provider", async () => {
    const auth = authModule.getAuth();

    expect(auth.options.socialProviders?.discord).toBeDefined();
    expect(auth.options.user?.additionalFields?.role).toMatchObject({
      type: "string",
      defaultValue: "user"
    });
    expect(auth.options.user?.additionalFields?.discordId).toMatchObject({
      type: "string",
      required: false,
      input: false
    });
  });

  it("maps the Discord profile id to discordId", async () => {
    const discord = authModule.getAuth().options.socialProviders?.discord;
    const mapped = await discord?.mapProfileToUser?.({
      id: "1234",
      username: "nolo",
      banner: "abc"
    } as Parameters<NonNullable<NonNullable<typeof discord>["mapProfileToUser"]>>[0]);
    expect(mapped).toEqual({
      discordId: "1234",
      discordUsername: "nolo",
      discordBanner: "abc"
    });
  });

  it("trusts local web origins outside production only", () => {
    const { authTrustedOrigins } = authModule;
    vi.stubEnv("NODE_ENV", "test");
    expect(authTrustedOrigins()).toContain("http://localhost:3000");
    expect(authTrustedOrigins()).toContain("http://localhost:3003");
    vi.stubEnv("NODE_ENV", "production");
    expect(authTrustedOrigins()).not.toContain("http://localhost:3000");
    expect(authTrustedOrigins()).not.toContain("http://localhost:3003");
  });
});