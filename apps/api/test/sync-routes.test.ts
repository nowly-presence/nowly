import { extensionToken, syncDocument } from "@nowly/database/schema/account";
import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn(async () => null) }
  })
}));

const DEVICE_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
const OTHER_DEVICE_ID = "1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f";
const UPDATED_AT = new Date("2026-10-04T10:00:00Z");

let database: TestDatabase;
let auth: Record<string, string>;

const buildApp = async () => {
  const { syncRoutes } = await import("@/features/sync/sync.routes");
  return mount("/sync", syncRoutes);
};

const seedDocument = (key: string, value: unknown, version: number, updatedAt = UPDATED_AT) =>
  database.db.insert(syncDocument).values({
    userId: "user-1",
    key,
    value,
    version,
    updatedAt,
    updatedByDeviceId: DEVICE_ID
  });

const storedDocument = async (key: string) => {
  const [row] = await database.db
    .select()
    .from(syncDocument)
    .where(and(eq(syncDocument.userId, "user-1"), eq(syncDocument.key, key)));
  return row;
};

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(() => database.close());

describe("sync routes", () => {
  beforeEach(async () => {
    await database.reset();
    await seedUser(database.db);
    auth = {
      authorization: `Bearer ${await seedExtensionToken({
        userId: "user-1",
        deviceId: DEVICE_ID,
        scopes: ["sync"]
      })}`
    };
  });

  it("requires a token with the sync scope", async () => {
    const app = await buildApp();
    expect(
      (
        await inject(app, {
          method: "GET",
          url: "/sync"
        })
      ).statusCode
    ).toBe(401);

    const creatorToken = await seedExtensionToken({
      userId: "user-1",
      deviceId: OTHER_DEVICE_ID,
      scopes: ["creator"]
    });
    expect(
      (
        await inject(app, {
          method: "GET",
          url: "/sync",
          headers: { authorization: `Bearer ${creatorToken}` }
        })
      ).statusCode
    ).toBe(401);
  });

  it("lists every document with the server time", async () => {
    await seedDocument("settings", { appearance: "dark" }, 2);
    await database.db.insert(syncDocument).values({
      userId: "user-1",
      key: "featureReveals",
      value: {},
      version: 1,
      updatedAt: UPDATED_AT
    });
    const app = await buildApp();

    const res = await inject(app, {
      method: "GET",
      url: "/sync",
      headers: auth
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().documents).toEqual([
      {
        key: "featureReveals",
        value: {},
        version: 1,
        updatedAt: "2026-10-04T10:00:00.000Z"
      },
      {
        key: "settings",
        value: { appearance: "dark" },
        version: 2,
        updatedAt: "2026-10-04T10:00:00.000Z"
      }
    ]);
    expect(typeof res.json().serverTime).toBe("string");
  });

  it("filters changes since a date and validates it", async () => {
    await seedDocument("settings", { appearance: "dark" }, 2, new Date("2026-10-04T08:00:00Z"));
    await seedDocument("presences", [], 1, new Date("2026-10-04T10:00:00Z"));
    const app = await buildApp();
    expect(
      (
        await inject(app, {
          method: "GET",
          url: "/sync/changes?since=yesterday",
          headers: auth
        })
      ).statusCode
    ).toBe(400);

    const res = await inject(app, {
      method: "GET",
      url: "/sync/changes?since=2026-10-04T09:00:00.000Z",
      headers: auth
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().documents.map((document: { key: string }) => document.key)).toEqual(["presences"]);
  });

  it("creates a document at version 1 and strips unknown or device-only fields", async () => {
    const app = await buildApp();

    const res = await inject(app, {
      method: "PUT",
      url: "/sync/settings",
      headers: auth,
      payload: {
        value: {
          appearance: "dark",
          customApiBaseUrl: "http://evil",
          developerMode: true,
          presencePaused: true
        },
        baseVersion: 0
      }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().version).toBe(1);
    expect(await storedDocument("settings")).toMatchObject({
      value: { appearance: "dark" },
      version: 1,
      updatedByDeviceId: DEVICE_ID
    });
  });

  it("updates only when baseVersion matches", async () => {
    await seedDocument("presences", [], 4);
    const app = await buildApp();

    const value = [
      {
        slug: "youtube",
        enabled: true,
        installedAt: 1
      }
    ];

    const res = await inject(app, {
      method: "PUT",
      url: "/sync/presences",
      headers: auth,
      payload: {
        value,
        baseVersion: 4
      }
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().version).toBe(5);
    expect(await storedDocument("presences")).toMatchObject({
      value,
      version: 5
    });
  });

  it("answers 409 with the current document when the version moved", async () => {
    await seedDocument("featureReveals", { "account-sync": 5 }, 7);
    const app = await buildApp();

    const res = await inject(app, {
      method: "PUT",
      url: "/sync/featureReveals",
      headers: auth,
      payload: {
        value: {},
        baseVersion: 6
      }
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: "VERSION_CONFLICT",
      value: { "account-sync": 5 },
      version: 7,
      updatedAt: "2026-10-04T10:00:00.000Z"
    });
    expect((await storedDocument("featureReveals")).version).toBe(7);
  });

  it("answers 409 when another device created the document first", async () => {
    await seedDocument(
      "presenceSettings",
      {
        youtube: { lang: "fr" }
      },
      1
    );
    const app = await buildApp();

    const res = await inject(app, {
      method: "PUT",
      url: "/sync/presenceSettings",
      headers: auth,
      payload: {
        value: {},
        baseVersion: 0
      }
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().version).toBe(1);
  });

  it("answers 409 with version 0 when the document was erased meanwhile", async () => {
    const app = await buildApp();

    const res = await inject(app, {
      method: "PUT",
      url: "/sync/featureReveals",
      headers: auth,
      payload: {
        value: {},
        baseVersion: 3
      }
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: "VERSION_CONFLICT",
      value: null,
      version: 0,
      updatedAt: null
    });
  });

  it("rejects unknown keys, invalid values and oversized documents", async () => {
    const app = await buildApp();

    const put = async (url: string, value: unknown, baseVersion = 0) =>
      (
        await inject(app, {
          method: "PUT",
          url,
          headers: auth,
          payload: { value, baseVersion }
        })
      ).statusCode;

    expect(await put("/sync/currentActivity", {})).toBe(404);
    expect(await put("/sync/settings", { appearance: "neon" })).toBe(400);
    expect(await put("/sync/settings", {}, -1)).toBe(400);
    const reveals = Object.fromEntries(
      Array.from({ length: 400 }, (_, index) => [
        `feature-${index}`,
        Date.now()
      ])
    );
    expect(await put("/sync/featureReveals", reveals)).toBe(413);
    expect(await database.db.select().from(syncDocument)).toEqual([]);
  });

  it("accepts customActivities ahead of 2.4.0", async () => {
    const app = await buildApp();

    const value = {
      items: [
        {
          id: "a1",
          name: "Studying",
          type: 0,
          details: "Chapter 3",
          state: "",
          largeImage: {
            kind: "icon",
            icon: "book",
            color: "#5865f2"
          },
          largeText: "",
          smallImage: { kind: "none" },
          smallText: "",
          timestamp: { mode: "elapsed" },
          buttons: [],
          createdAt: 1,
          updatedAt: 2
        }
      ],
      activeId: "a1"
    };

    const res = await inject(app, {
      method: "PUT",
      url: "/sync/customActivities",
      headers: auth,
      payload: {
        value,
        baseVersion: 0
      }
    });
    expect(res.statusCode).toBe(200);
    expect((await storedDocument("customActivities")).value).not.toHaveProperty("activeId");
  });

  it("erases the server copy and signs every device out", async () => {
    await seedDocument("settings", {}, 1);
    await seedDocument("presences", [], 1);
    await seedExtensionToken({
      userId: "user-1",
      deviceId: OTHER_DEVICE_ID,
      scopes: ["sync"]
    });
    const app = await buildApp();

    const res = await inject(app, {
      method: "DELETE",
      url: "/sync",
      headers: auth
    });
    expect(res.json()).toEqual({
      ok: true,
      deleted: 2
    });
    expect(await database.db.select().from(syncDocument)).toEqual([]);
    expect(await database.db.select().from(extensionToken).where(isNull(extensionToken.revokedAt))).toEqual([]);
  });
});