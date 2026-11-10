import { inject, mount } from "./http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRelay, createTelemetryRoutes } from "@/features/telemetry/telemetry.routes";

const event = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "extension_active",
  source: "extension",
  data: {}
} as const;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Umami relay", () => {
  it("fails closed without explicit consent or with private properties", async () => {
    const app = mount("/", createTelemetryRoutes());

    for (const body of [
      { event },
      {
        consent: false,
        event
      },
      {
        consent: true,
        event: {
          ...event,
          token: "private"
        }
      }
    ]) {
      expect(
        (
          await inject(app, {
            method: "POST",
            url: "/events",
            payload: body
          })
        ).statusCode
      ).toBe(400);
    }
  });

  it("coalesces concurrent replays, does not forward client headers, and retries failed delivery", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ cache: "accepted" }));
    const relay = createRelay(fetcher);
    await Promise.all([
      relay(event),
      relay(event)
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("https://stats.nowly.me/api/send");
    const init = fetcher.mock.calls[0][1];
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 NowlyProductTelemetry/1.0"
    });
    expect(init.body).not.toContain(event.id);
    const failing = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(Response.json({ cache: "accepted" }));
    const retry = createRelay(failing);
    await expect(retry(event)).rejects.toThrow();
    await retry(event);
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it("does not acknowledge bot-filtered or malformed upstream success responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ beep: "boop" }), { status: 200 }));
    const relay = createRelay(fetcher);
    await expect(relay(event)).rejects.toThrow("TELEMETRY_UNAVAILABLE");
    fetcher.mockResolvedValueOnce(new Response("", { status: 200 }));
    await expect(relay(event)).rejects.toThrow();
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ cache: "accepted" }), { status: 200 }));
    await expect(relay(event)).resolves.toBeUndefined();
    const ua = fetcher.mock.calls[0][1].headers["User-Agent"];
    expect(ua).toMatch(/^Mozilla\/5\.0 /);
    expect(ua).toContain("NowlyProductTelemetry/1.0");
  });

  it("bounds public ingestion by IP even when event ids change", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetcher = vi.fn(() => Promise.resolve(Response.json({ cache: "accepted" })));
    vi.stubGlobal("fetch", fetcher);
    const app = mount("/", createTelemetryRoutes());
    const send = (index: number, remoteAddress: string) =>
      inject(app, {
        method: "POST",
        url: "/events",
        remoteAddress,
        payload: {
          consent: true,
          event: {
            ...event,
            id: `22222222-2222-4222-8222-${String(index).padStart(12, "0")}`
          }
        }
      });

    for (let i = 0; i < 30; i++) expect((await send(i, "192.0.2.1")).statusCode).toBe(200);

    expect((await send(30, "192.0.2.1")).statusCode).toBe(429);
    expect(fetcher).toHaveBeenCalledTimes(30);
    expect((await send(31, "192.0.2.2")).statusCode).toBe(200);
  });

  it("relays the production contract only, without query, cookies or identity", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetcher = vi.fn().mockResolvedValue(Response.json({ cache: "accepted" }));
    vi.stubGlobal("fetch", fetcher);
    const app = mount("/telemetry", createTelemetryRoutes());
    const response = await inject(app, {
      method: "POST",
      url: "/telemetry/events?token=private",
      headers: {
        cookie: "session=secret",
        "user-agent": "PrivateBrowser",
        "x-forwarded-for": "192.0.2.1"
      },
      payload: {
        consent: true,
        event
      }
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    const serialized = JSON.stringify(fetcher.mock.calls);

    for (const secret of ["private", "secret", "PrivateBrowser", "192.0.2.1", event.id]) expect(serialized).not.toContain(secret);

    expect(JSON.parse(fetcher.mock.calls[0][1].body).payload).toMatchObject({
      name: "extension_active",
      url: "/product/extension"
    });
    expect(
      (
        await inject(app, {
          method: "POST",
          url: "/insights/events",
          payload: {
            events: [event]
          }
        })
      ).statusCode
    ).toBe(404);
  });

  it("rejects oversized bodies and fails softly on upstream failure or non-production", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetcher);
    const app = mount("/", createTelemetryRoutes());
    expect(
      (
        await inject(app, {
          method: "POST",
          url: "/events",
          payload: {
            consent: true,
            event
          }
        })
      ).statusCode
    ).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("NODE_ENV", "production");
    expect(
      (
        await inject(app, {
          method: "POST",
          url: "/events",
          payload: {
            consent: true,
            event
          }
        })
      ).statusCode
    ).toBe(503);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(
      (
        await inject(app, {
          method: "POST",
          url: "/events",
          payload: {
            consent: true,
            event,
            private: "x".repeat(1024)
          }
        })
      ).statusCode
    ).toBe(413);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});