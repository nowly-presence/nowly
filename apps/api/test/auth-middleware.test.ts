import { Hono } from "hono";
import { inject, mount } from "./http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("requireAuth", () => {
  beforeEach(() => {
    vi.stubEnv("API_SECRET_KEY", undefined);
  });

  afterEach(vi.unstubAllEnvs);

  it("returns 500 in production when API_SECRET_KEY is missing, instead of bypassing auth", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { requireAuth } = await import("@/features/auth/auth.middleware");

    const app = mount(
      "/",
      new Hono().post("/protected", requireAuth, (c) => c.json({ ok: true }))
    );

    const res = await inject(app, {
      method: "POST",
      url: "/protected"
    });

    expect(res.statusCode).toBe(500);
  });

  it("bypasses auth outside production when API_SECRET_KEY is missing (dev convenience)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { requireAuth } = await import("@/features/auth/auth.middleware");

    const app = mount(
      "/",
      new Hono().post("/protected", requireAuth, (c) => c.json({ ok: true }))
    );

    const res = await inject(app, {
      method: "POST",
      url: "/protected"
    });

    expect(res.statusCode).toBe(200);
  });

  it("rejects a request without the correct bearer token when a secret is configured", async () => {
    vi.stubEnv("API_SECRET_KEY", "test-secret");
    const { requireAuth } = await import("@/features/auth/auth.middleware");

    const app = mount(
      "/",
      new Hono().post("/protected", requireAuth, (c) => c.json({ ok: true }))
    );

    const res = await inject(app, {
      method: "POST",
      url: "/protected"
    });

    expect(res.statusCode).toBe(401);
  });

  it("allows a request with the correct bearer token", async () => {
    vi.stubEnv("API_SECRET_KEY", "test-secret");
    const { requireAuth } = await import("@/features/auth/auth.middleware");

    const app = mount(
      "/",
      new Hono().post("/protected", requireAuth, (c) => c.json({ ok: true }))
    );

    const res = await inject(app, {
      method: "POST",
      url: "/protected",
      headers: { authorization: "Bearer test-secret" }
    });

    expect(res.statusCode).toBe(200);
  });
});