import { createApp } from "@/app";
import { DEFAULT_BODY_LIMIT } from "@/middleware/body-limit";
import { resetRateLimits } from "@/middleware/rate-limit";
import { beforeEach, describe, expect, it } from "vitest";
import { inject } from "./http";

describe("app", () => {
  beforeEach(resetRateLimits);

  it("answers health, robots and unknown routes", async () => {
    const app = createApp();
    expect((await inject(app, { url: "/health" })).json()).toMatchObject({
      ok: true,
      service: "nowly-api"
    });
    expect((await inject(app, { url: "/robots.txt" })).body).toBe("User-agent: *\nDisallow: /\n");
    const missing = await inject(app, { url: "/nope" });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: "NOT_FOUND" });
  });

  it("keeps the 1 MiB default body limit of the previous server", async () => {
    const res = await inject(createApp(), {
      method: "POST",
      url: "/contact",
      headers: { "content-type": "application/json" },
      payload: "x".repeat(DEFAULT_BODY_LIMIT + 1)
    });
    expect(res.statusCode).toBe(413);
  });

  it("keeps the default cap on unknown routes sharing a large upload prefix", async () => {
    const res = await inject(createApp(), {
      method: "POST",
      url: "/me/presence-submissions-extra",
      payload: "x".repeat(DEFAULT_BODY_LIMIT + 1)
    });
    expect(res.json()).toEqual({ error: "PAYLOAD_TOO_LARGE" });
    expect(res.statusCode).toBe(413);
  });

  it("allows extension origins with credentials", async () => {
    const res = await inject(createApp(), {
      method: "OPTIONS",
      url: "/health",
      headers: {
        origin: "chrome-extension://abc",
        "access-control-request-method": "GET"
      }
    });
    expect(res.headers["access-control-allow-origin"]).toBe("chrome-extension://abc");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("applies the global rate limit", async () => {
    const app = createApp();
    let status = 0;

    for (let index = 0; index <= 100; index++)
      status = (
        await inject(app, {
          url: "/health",
          remoteAddress: "203.0.113.9"
        })
      ).statusCode;

    expect(status).toBe(429);
  });
});