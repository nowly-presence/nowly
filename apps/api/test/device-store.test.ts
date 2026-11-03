import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { deleteDeviceData, exportDeviceData, syncDevice } from "@/features/device/device.service";
import { user } from "@nowly/database/schema/auth";
import { customAsset, device, devicePresence, presenceActiveDevice } from "@nowly/database/schema/device";
import { presenceLike } from "@nowly/database/schema/presence";
import { eq } from "drizzle-orm";
import { createTestDatabase, type TestDatabase } from "./database";

let database: TestDatabase;

beforeAll(async () => {
  database = await createTestDatabase();
});
beforeEach(() => database.reset());
afterAll(() => database.close());

describe("device-store", () => {
  it("syncs an uninstall as installed false, enabled false, and uninstalledAt set", async () => {
    await syncDevice({
      deviceId: "device-1",
      presences: [
        {
          slug: "YouTube",
          version: "1.2.3",
          enabled: true,
          installed: false
        }
      ]
    });

    const [row] = await database.db.select().from(devicePresence).where(eq(devicePresence.deviceId, "device-1"));
    expect(row).toMatchObject({
      slug: "youtube",
      installedVersion: "1.2.3",
      installed: false,
      enabled: false
    });
    expect(row.uninstalledAt).toBeInstanceOf(Date);
  });

  it("updates an existing presence row on the next sync", async () => {
    await syncDevice({
      deviceId: "device-1",
      presences: [
        {
          slug: "youtube",
          version: "1.0.0",
          installed: false
        }
      ]
    });
    await syncDevice({
      deviceId: "device-1",
      browser: "firefox",
      presences: [
        {
          slug: "youtube",
          version: "1.1.0"
        }
      ]
    });

    const [row] = await database.db.select().from(devicePresence);
    expect(row).toMatchObject({
      installedVersion: "1.1.0",
      installed: true,
      enabled: true,
      uninstalledAt: null
    });
    const [stored] = await database.db.select().from(device);
    expect(stored.browser).toBe("firefox");
  });
});

describe("exportDeviceData / deleteDeviceData", () => {
  it("returns null when the device does not exist", async () => {
    expect(await exportDeviceData("device-1")).toBeNull();
  });

  it("exports functional device data without a retired analytics field", async () => {
    const { db } = database;
    await db.insert(user).values({
      id: "user-1",
      name: "A",
      email: "a@example.com"
    });
    await db.insert(device).values({
      deviceId: "device-1",
      extensionVersion: "1.0.0",
      browser: "firefox",
      os: "windows",
      locale: "en-US",
      userId: "user-1"
    });
    await db.insert(devicePresence).values({
      deviceId: "device-1",
      slug: "youtube",
      installedVersion: "1.0.0"
    });
    await db.insert(presenceLike).values({
      slug: "youtube",
      deviceId: "device-1",
      likedAt: new Date("2026-01-03T00:00:00Z")
    });

    const result = await exportDeviceData("device-1");

    expect(result?.device?.browser).toBe("firefox");
    expect(result?.presences).toEqual([
      {
        slug: "youtube",
        installed: true,
        enabled: true,
        installedVersion: "1.0.0"
      }
    ]);
    expect(result).not.toHaveProperty("analyticsEvents");
    expect(result?.customAssets).toEqual([]);
    expect(result?.presenceLikes).toEqual([
      {
        slug: "youtube",
        likedAt: "2026-01-03T00:00:00.000Z"
      }
    ]);
    expect(result?.linkedToAccount).toBe(true);
  });

  it("deletes every table scoped to the device and keeps other devices", async () => {
    const { db } = database;
    await db.insert(device).values([
      { deviceId: "device-1" },
      { deviceId: "device-2" }
    ]);
    await db.insert(devicePresence).values([
      {
        deviceId: "device-1",
        slug: "youtube"
      },
      {
        deviceId: "device-2",
        slug: "youtube"
      }
    ]);
    await db.insert(presenceActiveDevice).values({
      deviceId: "device-1",
      slug: "youtube"
    });
    await db.insert(presenceLike).values({
      deviceId: "device-1",
      slug: "youtube"
    });

    await deleteDeviceData("device-1");

    expect(await db.select().from(device)).toEqual([expect.objectContaining({ deviceId: "device-2" })]);
    expect(await db.select().from(devicePresence)).toHaveLength(1);
    expect(await db.select().from(presenceActiveDevice)).toHaveLength(0);
    expect(await db.select().from(presenceLike)).toHaveLength(0);
    expect(await db.select().from(customAsset)).toHaveLength(0);
  });
});