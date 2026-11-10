import { deriveDeviceToken } from "@/features/device/device-token";
import { presenceRoutes } from "@/features/presence/presence.routes";
import { device, devicePresence, presenceActiveDevice } from "@nowly/database/schema/device";
import { presence, presenceLike, presenceVersion } from "@nowly/database/schema/presence";
import { asc } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const DEVICE = "11111111-1111-4111-8111-111111111111";
const OTHER_DEVICE = "22222222-2222-4222-8222-222222222222";
const WEBHOOK = "https://discord.example/webhook";
let database: TestDatabase;
let app: ReturnType<typeof mount>;

beforeAll(async () => {
  database = await createTestDatabase();
});

beforeEach(async () => {
  await database.reset();
  vi.stubEnv("API_SECRET_KEY", "test-secret");
  app = mount("/presences", presenceRoutes);
});

afterEach(vi.unstubAllEnvs);
afterEach(vi.unstubAllGlobals);
afterAll(() => database.close());

describe("public presence routes", () => {
  it("returns an empty catalog when no presence exists", async () => {
    const response = await inject(app, { url: "/presences" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("returns global stats from devices, installs and fresh activity", async () => {
    const { db } = database;
    await db.insert(device).values([
      { deviceId: DEVICE },
      { deviceId: OTHER_DEVICE }
    ]);
    await db.insert(devicePresence).values([
      {
        deviceId: DEVICE,
        slug: "youtube"
      },
      {
        deviceId: OTHER_DEVICE,
        slug: "youtube",
        installed: false
      }
    ]);
    await db.insert(presenceActiveDevice).values([
      {
        deviceId: DEVICE,
        slug: "youtube"
      },
      {
        deviceId: DEVICE,
        slug: "twitch"
      },
      {
        deviceId: OTHER_DEVICE,
        slug: "youtube",
        lastSeenAt: new Date(0)
      }
    ]);

    const response = await inject(app, { url: "/presences/stats" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      totalUsers: 2,
      activeUsers: 1,
      activePresenceCount: 2,
      installedPresenceCount: 1
    });
  });

  it.each(["unknown", "archived"])("returns the same 404 for an %s presence", async (slug) => {
    await database.db.insert(presence).values({
      slug: "archived",
      archived: true,
      metadata: { name: "Hidden" }
    });
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    const response = await inject(app, { url: "/presences/" + slug });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: "PRESENCE_NOT_FOUND" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns saved version history in reverse chronological order", async () => {
    await database.db.insert(presence).values({
      slug: "youtube",
      version: "1.0.0"
    });
    await database.db.insert(presenceVersion).values([
      {
        slug: "youtube",
        version: "0.0.1",
        author: "alice",
        timestamp: new Date(1_000)
      },
      {
        slug: "youtube",
        version: "1.0.0",
        author: "bob",
        changelog: "First release",
        timestamp: new Date(2_000)
      }
    ]);

    const response = await inject(app, { url: "/presences/youtube/versions" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject([
      {
        version: "1.0.0",
        author: "bob",
        changelog: "First release",
        timestamp: 2_000
      },
      {
        version: "0.0.1",
        author: "alice",
        changelog: "",
        timestamp: 1_000
      }
    ]);
  });

  it.each([
    [
      "PUT",
      "youtube",
      { version: "1.0.0" }
    ],
    [
      "POST",
      "sync",
      {
        presences: []
      }
    ]
  ] as const)("requires the publication secret for %s /presences/%s", async (method, slug, payload) => {
    const response = await inject(app, {
      method,
      url: "/presences/" + slug,
      payload
    });
    expect(response.statusCode).toBe(401);
    expect(await database.db.select().from(presence)).toEqual([]);
  });
});

it("tracks multiple presences and clears one or all for the requested device", async () => {
  const { db } = database;
  await db.insert(device).values([
    { deviceId: DEVICE },
    { deviceId: OTHER_DEVICE }
  ]);
  await db.insert(presenceActiveDevice).values({
    deviceId: OTHER_DEVICE,
    slug: "youtube"
  });
  const tracked = () =>
    db
      .select({
        deviceId: presenceActiveDevice.deviceId,
        slug: presenceActiveDevice.slug
      })
      .from(presenceActiveDevice)
      .orderBy(asc(presenceActiveDevice.deviceId), asc(presenceActiveDevice.slug));

  const started = await inject(app, {
    method: "POST",
    url: "/presences/active",
    payload: {
      presences: ["YouTube", "twitch"],
      deviceId: DEVICE
    }
  });
  expect(started.statusCode).toBe(200);
  expect(started.json()).toEqual({
    ok: true,
    count: 2
  });
  expect(await tracked()).toEqual([
    {
      deviceId: DEVICE,
      slug: "twitch"
    },
    {
      deviceId: DEVICE,
      slug: "youtube"
    },
    {
      deviceId: OTHER_DEVICE,
      slug: "youtube"
    }
  ]);

  const path = "/presences/active/" + DEVICE;
  const single = await inject(app, {
    method: "DELETE",
    url: path + "/youtube"
  });
  expect(single.statusCode).toBe(200);
  expect(single.json()).toEqual({
    ok: true,
    removed: 1
  });
  expect(await tracked()).toEqual([
    {
      deviceId: DEVICE,
      slug: "twitch"
    },
    {
      deviceId: OTHER_DEVICE,
      slug: "youtube"
    }
  ]);

  const all = await inject(app, {
    method: "DELETE",
    url: path
  });
  expect(all.statusCode).toBe(200);
  expect(all.json()).toEqual({
    ok: true,
    removed: null
  });
  expect(await tracked()).toEqual([
    {
      deviceId: OTHER_DEVICE,
      slug: "youtube"
    }
  ]);
});

describe("presence reports", () => {
  const report = (slug: string, payload: unknown) =>
    inject(app, {
      method: "POST",
      url: "/presences/" + slug + "/report",
      payload
    });

  beforeEach(async () => {
    await database.db.insert(presence).values({
      slug: "youtube",
      metadata: {
        name: { "en-US": "YouTube" }
      }
    });
  });

  it("forwards an accepted report to Discord with the resolved name and client details", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_REPORT_URL", WEBHOOK);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    const response = await report("youtube", {
      message: "The presence stays idle on the watch page.",
      locale: "fr-FR",
      browser: "Firefox",
      browserVersion: "141.0"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [[url, sent]] = fetcher.mock.calls;
    expect(url).toBe(WEBHOOK);
    expect(JSON.parse(String(sent?.body)).embeds[0].fields).toEqual(
      expect.arrayContaining([
        {
          name: "Presence",
          value: "[YouTube](https://nowly.test/library/youtube)",
          inline: true
        },
        {
          name: "Locale",
          value: "fr-FR",
          inline: true
        },
        {
          name: "Browser",
          value: "Firefox",
          inline: true
        },
        {
          name: "Browser version",
          value: "141.0",
          inline: true
        },
        {
          name: "Problem",
          value: "The presence stays idle on the watch page.",
          inline: false
        }
      ])
    );
  });

  it.each([
    ["blank text", "youtube", "   ", 400, "INVALID_REQUEST_BODY"],
    [
      "oversized text",
      "youtube",
      "x".repeat(751),
      400,
      "INVALID_REQUEST_BODY"
    ],
    ["an unknown presence", "missing", "Broken", 404, "PRESENCE_NOT_FOUND"]
  ] as const)("rejects %s before contacting Discord", async (_case, slug, message, status, error) => {
    vi.stubEnv("DISCORD_WEBHOOK_REPORT_URL", WEBHOOK);
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);

    const response = await report(slug, { message });
    expect(response.statusCode).toBe(status);
    expect(response.json()).toEqual({ error });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns 503 when the report webhook is unavailable", async () => {
    vi.stubEnv("DISCORD_WEBHOOK_REPORT_URL", undefined);
    const response = await report("youtube", { message: "Broken timestamps" });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: "REPORTS_UNAVAILABLE" });
  });
});

describe("presence likes", () => {
  const path = "/presences/youtube/like";
  const withDevice = path + "?deviceId=" + DEVICE;

  it("creates, reads and removes a like with the signed device token", async () => {
    await database.db.insert(presenceLike).values({
      slug: "youtube",
      deviceId: OTHER_DEVICE
    });
    const headers = { "x-device-token": deriveDeviceToken(DEVICE) };

    const added = await inject(app, {
      method: "POST",
      url: path,
      payload: { deviceId: DEVICE },
      headers
    });
    expect(added.statusCode).toBe(200);
    expect(added.json()).toEqual({
      ok: true,
      count: 2
    });
    const liked = await inject(app, { url: withDevice });
    expect(liked.statusCode).toBe(200);
    expect(liked.json()).toEqual({
      liked: true,
      count: 2
    });

    const removed = await inject(app, {
      method: "DELETE",
      url: withDevice,
      headers
    });
    expect(removed.statusCode).toBe(200);
    expect(removed.json()).toEqual({
      ok: true,
      count: 1
    });
    const unliked = await inject(app, { url: withDevice });
    expect(unliked.statusCode).toBe(200);
    expect(unliked.json()).toEqual({
      liked: false,
      count: 1
    });
  });

  it.each(["POST", "GET", "DELETE"] as const)("requires a device id for %s", async (method) => {
    const response = await inject(app, {
      method,
      url: path,
      payload: method === "POST" ? {} : undefined
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "DEVICE_ID_REQUIRED" });
  });

  it.each(["POST", "DELETE"] as const)("requires a valid device token to %s a like", async (method) => {
    const request = {
      method,
      url: method === "POST" ? path : withDevice,
      payload: method === "POST" ? { deviceId: DEVICE } : undefined
    };
    if (method === "DELETE") await database.db.insert(presenceLike).values({
      slug: "youtube",
      deviceId: DEVICE
    });

    expect((await inject(app, request)).statusCode).toBe(401);
    expect(
      (
        await inject(app, {
          ...request,
          headers: { "x-device-token": deriveDeviceToken(OTHER_DEVICE) }
        })
      ).statusCode
    ).toBe(401);
    expect(await database.db.select({ deviceId: presenceLike.deviceId }).from(presenceLike)).toEqual(method === "POST" ? [] : [{ deviceId: DEVICE }]);
  });
});