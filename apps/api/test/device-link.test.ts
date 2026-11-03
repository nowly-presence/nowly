import { deriveDeviceToken } from "@/features/device/device-token";
import { extensionToken } from "@nowly/database/schema/account";
import { device } from "@nowly/database/schema/device";
import { presenceLike } from "@nowly/database/schema/presence";
import { asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDatabase, seedExtensionToken, seedUser, type TestDatabase } from "./database";
import { inject, mount } from "./http";

vi.mock("@/features/auth/better-auth", () => ({
  getAuth: () => ({
    api: { getSession: vi.fn(async () => null) }
  })
}));

const DEVICE_ID = "8b3f2e7c-5a0d-4c1e-9f6b-2d7a1c3e4f50";
const OTHER_DEVICE = "1f0e2d3c-4b5a-4968-8776-655443322110";

let database: TestDatabase;

const buildApp = async () => {
  const { deviceRoutes } = await import("@/features/device/device.routes");
  return mount("/devices", deviceRoutes);
};

const link = async (bearer: string | null, deviceToken: string | null) => {
  const headers: Record<string, string> = {};
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (deviceToken) headers["x-device-token"] = deviceToken;
  return inject(await buildApp(), {
    method: "POST",
    url: `/devices/${DEVICE_ID}/link`,
    headers
  });
};

beforeAll(async () => {
  database = await createTestDatabase();
});
beforeEach(async () => {
  await database.reset();
  await seedUser(database.db);
});
afterAll(() => database.close());

describe("POST /devices/:deviceId/link", () => {
  it("needs both the bearer token and the device token", async () => {
    const token = await seedExtensionToken({
      userId: "user-1",
      deviceId: DEVICE_ID,
      scopes: ["sync"]
    });

    expect((await link(null, deriveDeviceToken(DEVICE_ID))).statusCode).toBe(401);
    expect((await link(token, null)).statusCode).toBe(401);
    expect(await database.db.select().from(device)).toEqual([]);
  });

  it("refuses a token issued for another device", async () => {
    const token = await seedExtensionToken({
      userId: "user-1",
      deviceId: OTHER_DEVICE,
      scopes: ["sync"]
    });

    expect((await link(token, deriveDeviceToken(DEVICE_ID))).statusCode).toBe(403);
  });

  it("links the device, moves its likes to the account and keeps one like per presence", async () => {
    const token = await seedExtensionToken({
      userId: "user-1",
      scopes: ["sync"]
    });
    await database.db.insert(presenceLike).values([
      {
        slug: "youtube",
        deviceId: OTHER_DEVICE,
        userId: "user-1",
        likedAt: new Date("2026-01-01T00:00:00Z")
      },
      {
        slug: "twitch",
        deviceId: DEVICE_ID
      },
      {
        slug: "youtube",
        deviceId: DEVICE_ID
      }
    ]);

    const res = await link(token, deriveDeviceToken(DEVICE_ID));
    expect(res.statusCode).toBe(200);

    expect(await database.db.select({ userId: device.userId }).from(device).where(eq(device.deviceId, DEVICE_ID))).toEqual([{ userId: "user-1" }]);
    expect(
      await database.db
        .select({
          slug: presenceLike.slug,
          deviceId: presenceLike.deviceId,
          userId: presenceLike.userId
        })
        .from(presenceLike)
        .orderBy(asc(presenceLike.slug))
    ).toEqual([
      {
        slug: "twitch",
        deviceId: DEVICE_ID,
        userId: "user-1"
      },
      {
        slug: "youtube",
        deviceId: OTHER_DEVICE,
        userId: "user-1"
      }
    ]);
    expect(await database.db.select({ deviceId: extensionToken.deviceId }).from(extensionToken)).toEqual([{ deviceId: DEVICE_ID }]);
  });
});

describe("likes on a linked device", () => {
  it("does not count a second like from another device of the same account", async () => {
    const { likePresence, hasLikedPresence } = await import("@/features/presence/presence.repository");
    await database.db.insert(device).values({
      deviceId: DEVICE_ID,
      userId: "user-1"
    });
    await database.db.insert(presenceLike).values({
      slug: "youtube",
      deviceId: OTHER_DEVICE,
      userId: "user-1"
    });

    await likePresence("youtube", DEVICE_ID);
    expect(await database.db.select().from(presenceLike)).toHaveLength(1);
    expect(await hasLikedPresence("youtube", DEVICE_ID)).toBe(true);
  });

  it("stores anonymous likes per device as before", async () => {
    const { likePresence } = await import("@/features/presence/presence.repository");

    await likePresence("youtube", DEVICE_ID);
    await likePresence("youtube", DEVICE_ID);
    expect(
      await database.db
        .select({
          slug: presenceLike.slug,
          deviceId: presenceLike.deviceId,
          userId: presenceLike.userId
        })
        .from(presenceLike)
    ).toEqual([
      {
        slug: "youtube",
        deviceId: DEVICE_ID,
        userId: null
      }
    ]);
  });
});