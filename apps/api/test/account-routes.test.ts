import { overrideDatabase } from "@/db/client";
import { activityPublication } from "@nowly/database/schema/activity";
import { extensionToken, syncDocument } from "@nowly/database/schema/account";
import { account, user } from "@nowly/database/schema/auth";
import { device } from "@nowly/database/schema/device";
import { presenceLike } from "@nowly/database/schema/presence";
import { eq, isNull } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedExtensionToken, type TestDatabase } from "./database";
import { inject, mount } from "./http";

const mockSession = vi.hoisted(() => ({ userId: null as string | null }));

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn(async () => (mockSession.userId ? { user: { id: mockSession.userId } } : null)) }
  })
}));

const USER = {
  id: "user-1",
  name: "Nolo",
  image: "https://cdn.discordapp.com/a.png",
  discordId: "1234",
  email: "nolo@example.com",
  createdAt: new Date("2026-10-01T00:00:00Z")
};
const DEVICE_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
const OTHER_DEVICE_ID = "1f0e2d3c-4b5a-4968-8776-655443322110";

let database: TestDatabase;

const buildApp = async () => {
  const { accountRoutes } = await import("@/features/account/account.routes");
  return mount("/", accountRoutes);
};

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

const activeTokens = () => database.db.select().from(extensionToken).where(isNull(extensionToken.revokedAt));

beforeAll(async () => {
  database = await createTestDatabase();
});
afterAll(() => database.close());

describe("account routes", () => {
  beforeEach(async () => {
    overrideDatabase(database.db);
    await database.reset();
    await database.db.insert(user).values(USER);
    await database.db.insert(account).values({
      id: "account-1",
      userId: USER.id,
      accountId: "1234",
      providerId: "discord",
      createdAt: new Date("2026-10-01T00:00:00Z")
    });
    mockSession.userId = null;
  });

  afterEach(() => vi.unstubAllEnvs());

  it("refuses to mint an extension token without a site session", async () => {
    const res = await inject(await buildApp(), {
      method: "POST",
      url: "/extension/tokens",
      payload: {
        scopes: ["sync"]
      }
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: "UNAUTHORIZED" });
    expect(await database.db.select().from(extensionToken)).toEqual([]);
  });

  it("fails closed when the database is unavailable", async () => {
    overrideDatabase(null);
    mockSession.userId = USER.id;

    const res = await inject(await buildApp(), {
      method: "POST",
      url: "/extension/tokens",
      payload: {}
    });
    expect(res.statusCode).toBe(503);
  });

  it("mints a hashed token, revokes the device's previous ones and returns the contract shape", async () => {
    const previous = await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });
    mockSession.userId = USER.id;
    const before = Date.now();

    const res = await inject(await buildApp(), {
      method: "POST",
      url: "/extension/tokens",
      payload: {
        deviceId: DEVICE_ID,
        scopes: ["sync"]
      }
    });
    expect(res.statusCode).toBe(200);

    const body = res.json();
    expect(body.token).toMatch(/^nxt_[A-Za-z0-9_-]{43}$/);
    expect(body.token).not.toBe(previous);
    expect(body.user).toEqual({
      id: USER.id,
      name: USER.name,
      image: USER.image,
      discordId: "1234",
      githubLogin: null,
      role: "user",
      capabilities: []
    });
    expect(body.providers).toEqual(["discord"]);
    expect(typeof body.expiresAt).toBe("number");
    expect(body.expiresAt).toBeGreaterThan(before + 89 * 24 * 60 * 60 * 1000);

    const active = await activeTokens();
    expect(active).toHaveLength(1);
    expect(active[0].tokenHash).not.toBe(body.token);
    expect(active[0].tokenHash).not.toContain("nxt_");
    expect(active[0].scopes).toEqual(["sync"]);
  });

  it("rejects unknown scopes", async () => {
    mockSession.userId = USER.id;

    const res = await inject(await buildApp(), {
      method: "POST",
      url: "/extension/tokens",
      payload: {
        scopes: ["root"]
      }
    });
    expect(res.statusCode).toBe(400);
  });

  it("serves /me with a bearer extension token", async () => {
    const token = await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });

    const res = await inject(await buildApp(), {
      method: "GET",
      url: "/me",
      headers: bearer(token)
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      id: USER.id,
      discordId: "1234"
    });
  });

  it("rejects revoked or expired tokens", async () => {
    const app = await buildApp();

    const revoked = await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });
    await database.db.update(extensionToken).set({ revokedAt: new Date() });
    expect(
      (
        await inject(app, {
          method: "GET",
          url: "/me",
          headers: bearer(revoked)
        })
      ).statusCode
    ).toBe(401);

    const expired = await seedExtensionToken({
      userId: USER.id,
      deviceId: OTHER_DEVICE_ID,
      scopes: ["sync"]
    });
    await database.db
      .update(extensionToken)
      .set({ expiresAt: new Date(Date.now() - 1) })
      .where(eq(extensionToken.deviceId, OTHER_DEVICE_ID));
    expect(
      (
        await inject(app, {
          method: "GET",
          url: "/me",
          headers: bearer(expired)
        })
      ).statusCode
    ).toBe(401);
  });

  it("revokes the current token on sign out", async () => {
    const token = await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });
    await seedExtensionToken({
      userId: USER.id,
      deviceId: OTHER_DEVICE_ID,
      scopes: ["sync"]
    });

    const res = await inject(await buildApp(), {
      method: "DELETE",
      url: "/extension/tokens/current",
      headers: bearer(token)
    });
    expect(res.statusCode).toBe(200);
    expect((await activeTokens()).map((row) => row.deviceId)).toEqual([OTHER_DEVICE_ID]);
  });

  it("only lets the site session delete the account", async () => {
    const token = await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });
    await database.db.insert(device).values({
      deviceId: DEVICE_ID,
      userId: USER.id
    });
    await database.db.insert(syncDocument).values({
      userId: USER.id,
      key: "settings",
      value: {},
      version: 1
    });
    const app = await buildApp();

    expect(
      (
        await inject(app, {
          method: "DELETE",
          url: "/me",
          headers: bearer(token)
        })
      ).statusCode
    ).toBe(401);

    mockSession.userId = USER.id;
    expect(
      (
        await inject(app, {
          method: "DELETE",
          url: "/me"
        })
      ).statusCode
    ).toBe(200);
    expect(await database.db.select().from(user)).toEqual([]);
    expect(await database.db.select().from(syncDocument)).toEqual([]);
    expect(await database.db.select().from(extensionToken)).toEqual([]);
    expect(
      await database.db
        .select({
          deviceId: device.deviceId,
          userId: device.userId
        })
        .from(device)
    ).toEqual([
      {
        deviceId: DEVICE_ID,
        userId: null
      }
    ]);
  });

  it("exports the profile, devices, synced documents and likes without token hashes", async () => {
    mockSession.userId = USER.id;
    const publication = {
      id: "a".repeat(32),
      revision: 3,
      published: false,
      activity: { name: "Saved publication" }
    };
    await database.db.insert(activityPublication).values({
      ...publication,
      userId: USER.id,
      localKey: "local-1"
    });
    await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });
    await database.db.insert(syncDocument).values({
      userId: USER.id,
      key: "settings",
      value: { appearance: "dark" },
      version: 3,
      updatedAt: new Date("2026-10-03T00:00:00Z"),
      updatedByDeviceId: DEVICE_ID
    });
    await database.db.insert(presenceLike).values({
      slug: "youtube",
      deviceId: DEVICE_ID,
      userId: USER.id,
      likedAt: new Date("2026-10-03T00:00:00Z")
    });
    await database.db.insert(device).values({
      deviceId: DEVICE_ID,
      userId: USER.id,
      browser: "chrome",
      os: "windows",
      extensionVersion: "2.3.0",
      lastSeenAt: new Date("2026-10-04T00:00:00Z")
    });

    const res = await inject(await buildApp(), {
      method: "GET",
      url: "/me/export"
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.profile.email).toBe(USER.email);
    expect(body.activityPublications).toEqual([
      expect.objectContaining({
        ...publication,
        localKey: "local-1"
      })
    ]);
    expect(body.syncDocuments).toEqual([
      {
        key: "settings",
        value: { appearance: "dark" },
        version: 3,
        updatedAt: "2026-10-03T00:00:00.000Z",
        updatedByDeviceId: DEVICE_ID
      }
    ]);
    expect(body.presenceLikes).toEqual([
      {
        slug: "youtube",
        deviceId: DEVICE_ID,
        likedAt: "2026-10-03T00:00:00.000Z"
      }
    ]);
    expect(body.devices[0]).toMatchObject({
      deviceId: DEVICE_ID,
      browser: "chrome"
    });
    expect(JSON.stringify(body)).not.toContain("tokenHash");
  });

  it("lists linked devices and flags the current one", async () => {
    const token = await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });
    await database.db.insert(device).values([
      {
        deviceId: DEVICE_ID,
        userId: USER.id,
        browser: "chrome",
        os: "windows",
        extensionVersion: "2.3.0",
        lastSeenAt: new Date("2026-10-04T00:00:00Z")
      },
      {
        deviceId: "other",
        userId: USER.id,
        browser: "firefox",
        os: "linux",
        extensionVersion: "2.3.0",
        lastSeenAt: new Date("2026-10-03T00:00:00Z")
      }
    ]);

    const res = await inject(await buildApp(), {
      method: "GET",
      url: "/me/devices",
      headers: bearer(token)
    });
    expect(res.json().devices.map((entry: { current: boolean }) => entry.current)).toEqual([true, false]);
  });

  it("unlinks a device and revokes its tokens", async () => {
    mockSession.userId = USER.id;
    await database.db.insert(device).values({
      deviceId: DEVICE_ID,
      userId: USER.id
    });
    await seedExtensionToken({
      userId: USER.id,
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });

    const res = await inject(await buildApp(), {
      method: "DELETE",
      url: `/me/devices/${DEVICE_ID}`
    });
    expect(res.statusCode).toBe(200);
    expect(await database.db.select({ userId: device.userId }).from(device)).toEqual([{ userId: null }]);
    expect(await activeTokens()).toEqual([]);
  });
});