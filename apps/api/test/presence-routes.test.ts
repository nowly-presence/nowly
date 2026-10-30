import { deriveDeviceToken } from "@/features/device/device-token";
import { presenceRoutes } from "@/features/presence/presence.routes";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPresenceRepo = vi.hoisted(() => ({
  getAllPresenceSlugs: vi.fn(),
  getAllPresenceMetas: vi.fn(),
  getPresenceListData: vi.fn(),
  getPresenceMeta: vi.fn(),
  getPresenceStats: vi.fn(),
  getGlobalPresenceStats: vi.fn(),
  markActiveDevice: vi.fn(),
  clearActiveDevice: vi.fn(),
  clearActiveDevicesForDevice: vi.fn(),
  setPresenceMeta: vi.fn(),
  setVersion: vi.fn(),
  setAdded: vi.fn(),
  setUpdated: vi.fn(),
  addVersion: vi.fn(),
  getVersionHistory: vi.fn(),
  setArchived: vi.fn(),
  likePresence: vi.fn(),
  unlikePresence: vi.fn(),
  hasLikedPresence: vi.fn(),
  getLikeCount: vi.fn()
}));

const mockDeviceService = vi.hoisted(() => ({ deviceExists: vi.fn().mockResolvedValue(true) }));

vi.mock("@/features/presence/presence.repository", () => mockPresenceRepo);
vi.mock("@/features/device/device.service", () => mockDeviceService);

const mockPresenceReport = vi.hoisted(() => ({ submitPresenceReport: vi.fn() }));

vi.mock("@/features/presence/presence-report", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/presence/presence-report")>();
  return {
    ...actual,
    submitPresenceReport: mockPresenceReport.submitPresenceReport
  };
});

vi.mock("@/db/client", () => ({
  getPrisma: vi.fn(() => ({})),
  hasDatabase: vi.fn(() => true)
}));

const mockCrypto = vi.hoisted(() => ({
  sha256Base64Url: vi.fn(),
  canonicalJson: vi.fn(),
  signedPayload: vi.fn(),
  signPresenceRelease: vi.fn()
}));

vi.mock("@/shared/crypto.service", () => mockCrypto);

async function buildApp() {
  const app = Fastify();
  await app.register(cors, { origin: true });
  await app.register(presenceRoutes, { prefix: "/presences" });
  return app;
}

describe("Registry Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.API_SECRET_KEY;
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.API_SECRET_KEY;
  });

  it("GET /presences returns empty array when no slugs", async () => {
    mockPresenceRepo.getPresenceListData.mockResolvedValue([]);

    const res = await app.inject({
      method: "GET",
      url: "/presences"
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it("GET /presences returns registry with metadata and stats", async () => {
    mockPresenceRepo.getPresenceListData.mockResolvedValue([
      {
        name: "YouTube",
        slug: "youtube",
        author: {
          name: "Gaëtan H",
          github: "steellgold"
        },
        category: "streaming",
        description: { "en-US": "Watch videos" },
        color: "#FF0033",
        url: ["youtube.com"],
        assets: {
          logo: "logo.png",
          icon: "icon.png",
          thumbnail: "thumbnail.jpg"
        },
        tags: ["video"],
        version: "1.0.0",
        addedAt: "2024-01-01T00:00:00.000Z",
        lastUpdated: "2024-06-01T00:00:00.000Z",
        totalInstalls: 500,
        activeUsers: 42,
        likes: 0
      }
    ]);

    const res = await app.inject({
      method: "GET",
      url: "/presences"
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveLength(1);
    expect(body[0].version).toBe("1.0.0");
    expect(body[0].addedAt).toBe("2024-01-01T00:00:00.000Z");
    expect(body[0].lastUpdated).toBe("2024-06-01T00:00:00.000Z");
    expect(body[0].totalInstalls).toBe(500);
    expect(body[0].activeUsers).toBe(42);
  });

  it("GET /presences/stats returns global public stats", async () => {
    mockPresenceRepo.getGlobalPresenceStats.mockResolvedValue({
      totalUsers: 1200,
      activeUsers: 84,
      activePresenceCount: 96,
      installedPresenceCount: 2400
    });

    const res = await app.inject({
      method: "GET",
      url: "/presences/stats"
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({
      totalUsers: 1200,
      activeUsers: 84,
      activePresenceCount: 96,
      installedPresenceCount: 2400
    });
  });
});

describe("Presence Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPresenceRepo.getAllPresenceMetas.mockResolvedValue([]);
    delete process.env.API_SECRET_KEY;
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.API_SECRET_KEY;
  });

  it("GET /presences/:slug returns 404 for unknown", async () => {
    mockPresenceRepo.getPresenceMeta.mockResolvedValue(null);

    const res = await app.inject({
      method: "GET",
      url: "/presences/nonexistent"
    });

    expect(res.statusCode).toBe(404);
  });

  it("GET /presences/:slug returns 404 when archived", async () => {
    process.env.API_SECRET_KEY = "test-secret";
    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 12,
      activeUsers: 0,
      version: "1.0.0",
      archived: true,
      addedAt: null,
      lastUpdated: null
    });

    const res = await app.inject({
      method: "GET",
      url: "/presences/cinepulse"
    });

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ error: "PRESENCE_NOT_FOUND" });
    expect(mockPresenceRepo.getPresenceMeta).not.toHaveBeenCalled();
  });

  it("GET /presences/:slug returns 200 with release data", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("console.log('hello')")
      } as Response)
    );

    mockPresenceRepo.getPresenceMeta.mockResolvedValue({
      name: "YouTube",
      author: { name: "test" },
      category: "streaming",
      description: { "en-US": "Watch videos" },
      url: ["youtube.com"],
      color: "#FF0033",
      assets: {
        logo: "logo.png",
        icon: "icon.png",
        thumbnail: "thumbnail.jpg"
      },
      settings: {}
    });

    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 100,
      activeUsers: 10,
      version: "1.0.0",
      addedAt: "2024-01-01",
      lastUpdated: "2024-06-01"
    });

    mockCrypto.sha256Base64Url.mockReturnValue("abc123");
    mockCrypto.canonicalJson.mockReturnValue('{"name":"YouTube"}');
    mockCrypto.signedPayload.mockReturnValue("signed-payload");
    mockCrypto.signPresenceRelease.mockReturnValue("signature-value");

    const res = await app.inject({
      method: "GET",
      url: "/presences/youtube"
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.slug).toBe("youtube");
    expect(body.version).toBe("1.0.0");
    expect(body.bundle).toBe("console.log('hello')");
    expect(body.sha256).toBe("abc123");
    expect(body.metadataHash).toBe("abc123");
    expect(body.signature).toBe("signature-value");
    expect(body.totalInstalls).toBe(100);
    expect(body.activeUsers).toBe(10);

    globalThis.fetch = originalFetch;
  });

  it("GET /presences/:slug/versions returns version history", async () => {
    const history = [
      {
        version: "1.0.0",
        changelog: '{"en-US":"First release","fr-FR":"Première version","es-ES":"Primera versión"}',
        author: "test",
        timestamp: 1700000000000
      },
      {
        version: "0.0.1",
        changelog: "",
        author: "test",
        timestamp: 1690000000000
      }
    ];

    mockPresenceRepo.getVersionHistory.mockResolvedValue(history);

    const res = await app.inject({
      method: "GET",
      url: "/presences/youtube/versions"
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(history);
  });

  it("PUT /presences/:slug returns 401 without auth when secret is configured", async () => {
    process.env.API_SECRET_KEY = "test-secret";

    const res = await app.inject({
      method: "PUT",
      url: "/presences/youtube",
      payload: { version: "1.0.0" }
    });

    expect(res.statusCode).toBe(401);
  });

  it("PUT /presences/:slug returns 200 with valid auth", async () => {
    process.env.API_SECRET_KEY = "test-secret";

    mockPresenceRepo.setVersion.mockResolvedValue(undefined as any);
    mockPresenceRepo.addVersion.mockResolvedValue(undefined as any);

    const res = await app.inject({
      method: "PUT",
      url: "/presences/youtube",
      headers: { authorization: "Bearer test-secret" },
      payload: {
        version: "2.0.0",
        changelog: "Big update",
        author: "dev",
        authorGithub: "dev-github",
        pr: "42",
        added: "2024-01-01",
        updated: "2024-06-01"
      }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
    expect(mockPresenceRepo.setVersion).toHaveBeenCalledWith("youtube", "2.0.0", expect.any(Date));
    const publishedAt = mockPresenceRepo.setVersion.mock.calls[0][2];
    expect(mockPresenceRepo.addVersion.mock.calls[0][1].timestamp).toBe(publishedAt.getTime());
    expect(mockPresenceRepo.setAdded).toHaveBeenCalledWith("youtube", "2024-01-01");
    expect(mockPresenceRepo.setUpdated).toHaveBeenCalledWith("youtube", "2024-06-01");
  });

  it("POST /presences/sync returns 401 without auth", async () => {
    process.env.API_SECRET_KEY = "test-secret";

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: {
        presences: []
      }
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /presences/sync processes presences and returns results", async () => {
    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 0,
      activeUsers: 0,
      version: null,
      addedAt: null,
      lastUpdated: null
    });
    mockPresenceRepo.setVersion.mockResolvedValue(undefined as any);
    mockPresenceRepo.setPresenceMeta.mockResolvedValue(undefined as any);
    mockPresenceRepo.setAdded.mockResolvedValue(undefined as any);
    mockPresenceRepo.addVersion.mockResolvedValue(undefined as any);

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: {
        presences: [
          {
            slug: "youtube",
            type: "new",
            name: "YouTube",
            category: "video",
            author: "dev",
            description: { "en-US": "Watch videos" }
          }
        ],
        pr: "42",
        prTitle: "Add YouTube presence"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].slug).toBe("youtube");
    expect(body.results[0].version).toBe("1.0.0");
    expect(body.results[0].changelog).toContain("Watch videos");
    expect(mockPresenceRepo.setVersion).toHaveBeenCalledWith("youtube", "1.0.0", expect.any(Date));
    const publishedAt = mockPresenceRepo.setVersion.mock.calls[0][2];
    expect(mockPresenceRepo.setAdded).toHaveBeenCalledWith("youtube", publishedAt);
    expect(mockPresenceRepo.addVersion.mock.calls[0][1].timestamp).toBe(publishedAt.getTime());
    expect(mockPresenceRepo.setUpdated).not.toHaveBeenCalled();
    expect(mockPresenceRepo.setPresenceMeta).toHaveBeenCalledWith(
      "youtube",
      expect.objectContaining({
        slug: "youtube",
        name: "YouTube",
        author: "dev",
        category: "video"
      })
    );
    expect(mockPresenceRepo.setArchived).toHaveBeenCalledWith("youtube", false);
  });

  it("POST /presences/sync preserves addedAt for modified publications", async () => {
    mockPresenceRepo.getPresenceStats.mockResolvedValue({
      totalInstalls: 0,
      activeUsers: 0,
      version: "1.0.0",
      addedAt: "2024-01-01T00:00:00.000Z",
      lastUpdated: "2024-02-01T00:00:00.000Z"
    });
    mockPresenceRepo.setVersion.mockResolvedValue(undefined);
    mockPresenceRepo.setPresenceMeta.mockResolvedValue(undefined);
    mockPresenceRepo.addVersion.mockResolvedValue(undefined);

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: {
        presences: [
          {
            slug: "youtube",
            type: "modified",
            name: "YouTube",
            author: "dev",
            changelog: "Fix playback status"
          }
        ]
      }
    });

    expect(res.statusCode).toBe(200);
    expect(mockPresenceRepo.setVersion).toHaveBeenCalledWith("youtube", "1.0.1", expect.any(Date));
    expect(mockPresenceRepo.setAdded).not.toHaveBeenCalled();
    expect(mockPresenceRepo.setUpdated).not.toHaveBeenCalled();
  });

  it("POST /presences/sync rejects conflicting aliases before any write", async () => {
    mockPresenceRepo.getAllPresenceMetas.mockResolvedValue([
      {
        slug: "youtube",
        metadata: {
          slug: "youtube",
          aliases: ["yt"]
        }
      },
      {
        slug: "openfront.io",
        metadata: {
          slug: "openfront.io",
          aliases: ["openfront"]
        }
      }
    ]);

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: {
        presences: [
          {
            slug: "youtube-music",
            type: "new",
            name: "YouTube Music",
            metadata: {
              slug: "youtube-music",
              name: "YouTube Music",
              aliases: ["yt", "youtube", "Music"]
            }
          },
          {
            slug: "openfront",
            type: "new",
            name: "OpenFront"
          }
        ]
      }
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({
      error: "PRESENCE_ALIAS_CONFLICT",
      issues: [
        'youtube-music: Alias "yt" is already an alias of "youtube"',
        'youtube-music: Alias "youtube" is already the slug of "youtube"',
        'youtube-music: Alias "Music" must use lowercase letters, digits, dots or hyphens (max 80 characters)',
        'openfront: Slug "openfront" is already an alias of "openfront.io"'
      ]
    });
    expect(mockPresenceRepo.setVersion).not.toHaveBeenCalled();
    expect(mockPresenceRepo.setPresenceMeta).not.toHaveBeenCalled();
    expect(mockPresenceRepo.setArchived).not.toHaveBeenCalled();
  });

  it("POST /presences/sync accepts aliases moved within the same batch", async () => {
    mockPresenceRepo.getAllPresenceMetas.mockResolvedValue([
      {
        slug: "youtube",
        metadata: {
          slug: "youtube",
          aliases: ["yt"]
        }
      }
    ]);
    mockPresenceRepo.getPresenceStats.mockResolvedValue({ version: "1.0.0" });
    mockPresenceRepo.getVersionHistory.mockResolvedValue([]);

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      payload: {
        presences: [
          {
            slug: "youtube",
            type: "modified",
            name: "YouTube",
            changelog: "Move alias",
            metadata: {
              slug: "youtube",
              aliases: []
            }
          },
          {
            slug: "youtube-music",
            type: "modified",
            name: "YouTube Music",
            changelog: "Take alias",
            metadata: {
              slug: "youtube-music",
              aliases: ["yt"]
            }
          }
        ]
      }
    });

    expect(res.statusCode).toBe(200);
    expect(mockPresenceRepo.setPresenceMeta).toHaveBeenCalledWith("youtube-music", {
      slug: "youtube-music",
      aliases: ["yt"]
    });
  });

  it("POST /presences/sync archives removed slugs", async () => {
    mockPresenceRepo.setArchived.mockResolvedValue(true);

    const res = await app.inject({
      method: "POST",
      url: "/presences/sync",
      headers: { authorization: "Bearer test-secret" },
      payload: {
        archivedSlugs: ["cinepulse"],
        pr: "11",
        prTitle: "Remove Cinepulse"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.results).toEqual([]);
    expect(body.archived).toEqual(["cinepulse"]);
    expect(mockPresenceRepo.setArchived).toHaveBeenCalledWith("cinepulse", true);
  });
});

describe("Stats Routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    vi.clearAllMocks();
    delete process.env.API_SECRET_KEY;
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.API_SECRET_KEY;
  });

  it("POST /presences/active updates multiple presences and DELETE endpoints clear active tracks", async () => {
    // 1. POST /presences/active updates multiple presences
    mockPresenceRepo.markActiveDevice.mockResolvedValue(undefined as any);
    const postRes = await app.inject({
      method: "POST",
      url: "/presences/active",
      payload: {
        presences: ["youtube", "twitch"],
        deviceId: "22222222-2222-4222-8222-222222222222"
      }
    });
    expect(postRes.statusCode).toBe(200);
    expect(JSON.parse(postRes.body)).toEqual({
      ok: true,
      count: 2
    });
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledTimes(2);
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledWith("youtube", "22222222-2222-4222-8222-222222222222");
    expect(mockPresenceRepo.markActiveDevice).toHaveBeenCalledWith("twitch", "22222222-2222-4222-8222-222222222222");

    // 2. DELETE /presences/active/:deviceId/:slug clears one tracked presence
    mockPresenceRepo.clearActiveDevice.mockResolvedValue(undefined as any);
    const deleteSingleRes = await app.inject({
      method: "DELETE",
      url: "/presences/active/device-123/youtube"
    });
    expect(deleteSingleRes.statusCode).toBe(200);
    expect(JSON.parse(deleteSingleRes.body)).toEqual({
      ok: true,
      removed: 1
    });
    expect(mockPresenceRepo.clearActiveDevice).toHaveBeenCalledWith("youtube", "device-123");

    // 3. DELETE /presences/active/:deviceId clears every tracked presence
    mockPresenceRepo.clearActiveDevicesForDevice.mockResolvedValue(undefined as any);
    const deleteAllRes = await app.inject({
      method: "DELETE",
      url: "/presences/active/device-123"
    });
    expect(deleteAllRes.statusCode).toBe(200);
    expect(JSON.parse(deleteAllRes.body)).toEqual({
      ok: true,
      removed: null
    });
    expect(mockPresenceRepo.clearActiveDevicesForDevice).toHaveBeenCalledWith("device-123");
  });

  it("POST /presences/:slug/report handles valid report submission and error scenarios", async () => {
    mockPresenceRepo.getPresenceMeta.mockResolvedValue({
      name: { "en-US": "YouTube" }
    });
    mockPresenceRepo.getPresenceStats.mockResolvedValue({ archived: false });
    mockPresenceReport.submitPresenceReport.mockResolvedValue("sent");

    // Valid submission
    const res = await app.inject({
      method: "POST",
      url: "/presences/youtube/report",
      payload: {
        message: "The presence stays idle on the watch page.",
        locale: "fr-FR",
        browser: "Firefox",
        browserVersion: "141.0"
      }
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
    expect(mockPresenceReport.submitPresenceReport).toHaveBeenCalledWith({
      slug: "youtube",
      name: "YouTube",
      message: "The presence stays idle on the watch page.",
      locale: "fr-FR",
      browser: "Firefox",
      browserVersion: "141.0"
    });

    // Rejects empty or oversized messages
    mockPresenceRepo.getPresenceMeta.mockResolvedValue({ name: "YouTube" });
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/presences/youtube/report",
          payload: { message: "   " }
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/presences/youtube/report",
          payload: { message: "x".repeat(751) }
        })
      ).statusCode
    ).toBe(400);

    // 404 for unknown presences
    mockPresenceRepo.getPresenceMeta.mockResolvedValue(null);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/presences/missing/report",
          payload: { message: "Broken" }
        })
      ).statusCode
    ).toBe(404);

    // 503 when Discord service is unconfigured
    mockPresenceRepo.getPresenceMeta.mockResolvedValue({ name: "YouTube" });
    mockPresenceReport.submitPresenceReport.mockResolvedValue("unconfigured");
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/presences/youtube/report",
          payload: { message: "Broken timestamps" }
        })
      ).statusCode
    ).toBe(503);
  });
});

describe("Presence Likes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  const validDeviceId = "11111111-1111-4111-8111-111111111111";

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("handles like and unlike lifecycles with valid device token auth", async () => {
    // Like
    mockPresenceRepo.getLikeCount.mockResolvedValueOnce(3);
    const likeRes = await app.inject({
      method: "POST",
      url: "/presences/youtube/like",
      payload: { deviceId: validDeviceId },
      headers: { "x-device-token": deriveDeviceToken(validDeviceId) }
    });
    expect(likeRes.statusCode).toBe(200);
    expect(JSON.parse(likeRes.body)).toEqual({
      ok: true,
      count: 3
    });
    expect(mockPresenceRepo.likePresence).toHaveBeenCalledWith("youtube", validDeviceId);

    // Status query
    mockPresenceRepo.hasLikedPresence.mockResolvedValueOnce(true);
    mockPresenceRepo.getLikeCount.mockResolvedValueOnce(3);
    const statusRes = await app.inject({
      method: "GET",
      url: `/presences/youtube/like?deviceId=${validDeviceId}`
    });
    expect(statusRes.statusCode).toBe(200);
    expect(JSON.parse(statusRes.body)).toEqual({
      liked: true,
      count: 3
    });

    // Unlike
    mockPresenceRepo.getLikeCount.mockResolvedValueOnce(2);
    const unlikeRes = await app.inject({
      method: "DELETE",
      url: `/presences/youtube/like?deviceId=${validDeviceId}`,
      headers: { "x-device-token": deriveDeviceToken(validDeviceId) }
    });
    expect(unlikeRes.statusCode).toBe(200);
    expect(JSON.parse(unlikeRes.body)).toEqual({
      ok: true,
      count: 2
    });
    expect(mockPresenceRepo.unlikePresence).toHaveBeenCalledWith("youtube", validDeviceId);
  });

  it("enforces deviceId requirement and token authorization on all like endpoints", async () => {
    // Missing deviceId -> 400
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/presences/youtube/like",
          payload: {}
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: "/presences/youtube/like"
        })
      ).statusCode
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: "GET",
          url: "/presences/youtube/like"
        })
      ).statusCode
    ).toBe(400);

    // Missing / invalid token -> 401
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/presences/youtube/like",
          payload: { deviceId: validDeviceId }
        })
      ).statusCode
    ).toBe(401);
    expect(
      (
        await app.inject({
          method: "DELETE",
          url: `/presences/youtube/like?deviceId=${validDeviceId}`
        })
      ).statusCode
    ).toBe(401);

    expect(mockPresenceRepo.likePresence).not.toHaveBeenCalled();
    expect(mockPresenceRepo.unlikePresence).not.toHaveBeenCalled();
  });
});