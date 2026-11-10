import { savePresenceRelease } from "@/features/presence/presence.repository";
import { presenceRoutes } from "@/features/presence/presence.routes";
import { presence, presenceVersion } from "@nowly/database/schema/presence";
import { asc, eq } from "drizzle-orm";
import { createHash, generateKeyPairSync, verify } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const authorization = "Bearer test-secret";

const request = (method: "POST" | "PUT", slug: string, payload: unknown) =>
  inject(mount("/presences", presenceRoutes), {
    method,
    url: `/presences/${slug}`,
    headers: { authorization },
    payload
  });

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase();
});

beforeEach(async () => {
  vi.stubEnv("API_SECRET_KEY", "test-secret");
  await database.reset();
});

afterEach(vi.unstubAllEnvs);
afterEach(vi.unstubAllGlobals);
afterAll(() => database.close());

describe("presence publication", () => {
  it("stores supplied dates on first publication and keeps the original added date on updates", async () => {
    const added = "2024-01-01";
    const updated = "2024-06-01";
    const created = await request("PUT", "youtube", {
      version: "2.0.0",
      changelog: "Big update",
      author: "dev",
      authorGithub: "dev-github",
      pr: "42",
      added,
      updated
    });

    expect(created.statusCode).toBe(200);
    expect(created.json()).toEqual({ ok: true });
    expect(await database.db.select().from(presence)).toMatchObject([
      {
        slug: "youtube",
        version: "2.0.0",
        addedAt: new Date(added),
        updatedAt: new Date(updated)
      }
    ]);
    const [release] = await database.db.select().from(presenceVersion);
    expect(release).toMatchObject({
      slug: "youtube",
      version: "2.0.0",
      author: "dev",
      authorGithub: "dev-github",
      pr: "42"
    });
    expect(JSON.parse(release.changelog)["en-US"]).toBe("Big update");

    const changed = await request("PUT", "youtube", {
      version: "2.0.1",
      added: updated,
      updated: "2024-07-01"
    });
    expect(changed.statusCode).toBe(200);
    expect(await database.db.select().from(presence)).toMatchObject([
      {
        slug: "youtube",
        version: "2.0.1",
        addedAt: new Date(added),
        updatedAt: new Date("2024-07-01")
      }
    ]);
  });

  it("syncs release history and metadata while preserving the first publication date", async () => {
    const initial = await request("POST", "sync", {
      presences: [
        {
          slug: "youtube",
          type: "new",
          name: "YouTube",
          author: "dev",
          category: "video",
          description: { "en-US": "Watch videos" }
        }
      ],
      pr: "42",
      prTitle: "Add YouTube presence"
    });
    expect(initial.statusCode).toBe(200);
    expect(initial.json()).toMatchObject({
      ok: true,
      results: [
        {
          slug: "youtube",
          version: "1.0.0",
          changelog: expect.stringContaining("Watch videos")
        }
      ]
    });
    const [first] = await database.db.select().from(presence);
    expect(first.metadata).toMatchObject({
      slug: "youtube",
      name: "YouTube",
      author: "dev",
      category: "video"
    });
    expect(first.addedAt).toEqual(first.updatedAt);

    await database.db.update(presence).set({ archived: true }).where(eq(presence.slug, "youtube"));
    const updated = await request("POST", "sync", {
      presences: [
        {
          slug: "youtube",
          type: "modified",
          name: "YouTube",
          changelog: "Fix playback status"
        }
      ]
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      ok: true,
      results: [
        {
          slug: "youtube",
          version: "1.0.1"
        }
      ]
    });
    const [latest] = await database.db.select().from(presence);
    expect(latest).toMatchObject({
      addedAt: first.addedAt,
      version: "1.0.1",
      archived: false
    });
    const history = await database.db.select().from(presenceVersion).orderBy(asc(presenceVersion.version));
    expect(history).toMatchObject([
      {
        version: "1.0.0",
        versionType: "new",
        author: "dev",
        timestamp: first.updatedAt
      },
      {
        version: "1.0.1",
        versionType: "patch",
        author: "dev",
        timestamp: latest.updatedAt
      }
    ]);
  });

  it("rolls back the catalog when writing release history fails", async () => {
    await database.db.insert(presence).values({
      slug: "youtube",
      version: "1.0.0"
    });
    await expect(
      savePresenceRelease("youtube", {
        publication: {
          version: "2.0.0",
          history: {
            author: "dev",
            changelog: "",
            timestamp: Date.now(),
            bundleSizeBytes: Number.MAX_SAFE_INTEGER
          }
        }
      })
    ).rejects.toThrow();
    expect(await database.db.select().from(presence)).toMatchObject([{ version: "1.0.0" }]);
    expect(await database.db.select().from(presenceVersion)).toEqual([]);
  });

  it("rejects conflicting aliases before writing any releases", async () => {
    await database.db.insert(presence).values([
      {
        slug: "youtube",
        metadata: {
          aliases: ["yt"]
        }
      },
      {
        slug: "openfront.io",
        metadata: {
          aliases: ["openfront"]
        }
      }
    ]);
    const response = await request("POST", "sync", {
      presences: [
        {
          slug: "valid-first",
          type: "new",
          name: "Valid First"
        },
        {
          slug: "youtube-music",
          type: "new",
          name: "YouTube Music",
          metadata: {
            aliases: ["yt", "youtube", "Music"]
          }
        },
        {
          slug: "openfront",
          type: "new",
          name: "OpenFront"
        }
      ]
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "PRESENCE_ALIAS_CONFLICT",
      issues: [
        'youtube-music: Alias "yt" is already an alias of "youtube"',
        'youtube-music: Alias "youtube" is already the slug of "youtube"',
        'youtube-music: Alias "Music" must use lowercase letters, digits, dots or hyphens (max 80 characters)',
        'openfront: Slug "openfront" is already an alias of "openfront.io"'
      ]
    });
    expect(await database.db.select({ slug: presence.slug }).from(presence).orderBy(asc(presence.slug))).toEqual([
      { slug: "openfront.io" },
      { slug: "youtube" }
    ]);
    expect(await database.db.select().from(presenceVersion)).toEqual([]);
  });

  it("allows aliases to move between presences in one sync", async () => {
    await database.db.insert(presence).values({
      slug: "youtube",
      version: "1.0.0",
      metadata: {
        aliases: ["yt"]
      }
    });
    const response = await request("POST", "sync", {
      presences: [
        {
          slug: "youtube",
          type: "modified",
          name: "YouTube",
          metadata: {
            aliases: []
          },
          changelog: "Move alias"
        },
        {
          slug: "youtube-music",
          type: "new",
          name: "YouTube Music",
          metadata: {
            aliases: ["yt"]
          },
          changelog: "Take alias"
        }
      ]
    });
    expect(response.statusCode).toBe(200);
    expect(
      await database.db
        .select({
          slug: presence.slug,
          metadata: presence.metadata
        })
        .from(presence)
        .orderBy(asc(presence.slug))
    ).toEqual([
      {
        slug: "youtube",
        metadata: {
          aliases: []
        }
      },
      {
        slug: "youtube-music",
        metadata: {
          aliases: ["yt"]
        }
      }
    ]);
  });

  it("archives removed presences without writing releases", async () => {
    await database.db.insert(presence).values({ slug: "cinepulse" });
    const response = await request("POST", "sync", {
      archivedSlugs: ["cinepulse"],
      pr: "11",
      prTitle: "Remove Cinepulse"
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      results: [],
      archived: ["cinepulse"]
    });
    expect(await database.db.select().from(presence)).toMatchObject([
      {
        slug: "cinepulse",
        archived: true
      }
    ]);
    expect(await database.db.select().from(presenceVersion)).toEqual([]);
  });
});

describe("signed release settings backfill", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const base = "https://cdn.nowly.me/presences/youtube/versions/1.0.0";
  const settings = [
    {
      id: "color",
      type: "text"
    }
  ];

  beforeEach(async () => {
    vi.stubEnv(
      "PRESENCE_SIGNING_PRIVATE_KEY",
      privateKey
        .export({
          format: "der",
          type: "pkcs8"
        })
        .toString("base64url")
    );
    await database.db.insert(presence).values({
      slug: "youtube",
      version: "1.0.0",
      metadata: { name: "YouTube" }
    });
  });

  it("serves a verifiable current release and caches its missing settings", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url === base + "/bundle.js") return new Response("bundle");
      if (url === base + "/settings.json") return Response.json(settings);

      return new Response(null, { status: 404 });
    });
    vi.stubGlobal("fetch", fetcher);

    const response = await inject(mount("/presences", presenceRoutes), { url: "/presences/youtube" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(fetcher.mock.calls).toEqual([
      [base + "/bundle.js"],
      [base + "/settings.json"]
    ]);
    const release = response.json();
    expect(release).toMatchObject({
      slug: "youtube",
      version: "1.0.0",
      bundle: "bundle",
      totalInstalls: 0,
      activeUsers: 0,
      metadata: {
        name: "YouTube",
        settings
      },
      signature: expect.any(String)
    });
    const digest = (value: string) => createHash("sha256").update(value).digest("base64url");
    expect(release.sha256).toBe(digest("bundle"));
    expect(release.metadataHash).toBe(
      digest(
        JSON.stringify({
          name: "YouTube",
          settings,
          slug: "youtube",
          version: "1.0.0"
        })
      )
    );
    const signed = JSON.stringify({
      metadataHash: release.metadataHash,
      sha256: release.sha256,
      signedAt: release.signedAt,
      slug: "youtube",
      version: "1.0.0"
    });
    expect(
      verify(
        "sha256",
        Buffer.from(signed),
        {
          key: publicKey,
          dsaEncoding: "ieee-p1363"
        },
        Buffer.from(release.signature, "base64url")
      )
    ).toBe(true);
    expect(await database.db.select({ metadata: presence.metadata }).from(presence)).toEqual([
      {
        metadata: {
          name: "YouTube",
          settings
        }
      }
    ]);
  });

  it.each([
    ["current", "/presences/youtube", "1.0.0"],
    ["historical", "/presences/youtube/versions/1.0.0", "1.1.0"]
  ])("returns the %s release without overwriting a publication made during the CDN fetch", async (_case, url, currentVersion) => {
    const newMetadata = {
      name: "Updated YouTube",
      aliases: ["yt"]
    };
    await database.db.update(presence).set({ version: currentVersion });
    const fetcher = vi.fn(async (url: string) => {
      if (url === base + "/bundle.js") return new Response("original bundle");
      if (url !== base + "/settings.json") return new Response(null, { status: 404 });

      await savePresenceRelease("youtube", {
        publication: { version: "2.0.0" },
        metadata: newMetadata
      });
      return Response.json(settings);
    });
    vi.stubGlobal("fetch", fetcher);

    const response = await inject(mount("/presences", presenceRoutes), { url });
    expect(response.statusCode).toBe(200);
    expect(fetcher.mock.calls).toEqual([
      [base + "/bundle.js"],
      [base + "/settings.json"]
    ]);
    expect(response.json()).toMatchObject({
      version: "1.0.0",
      bundle: "original bundle",
      metadata: {
        name: "YouTube",
        settings
      },
      signature: expect.any(String)
    });
    expect(
      await database.db
        .select({
          version: presence.version,
          metadata: presence.metadata
        })
        .from(presence)
    ).toEqual([
      {
        version: "2.0.0",
        metadata: newMetadata
      }
    ]);
  });
});