import { createHash, randomUUID } from "node:crypto";
import { inject, mount } from "./http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { serverEnv } from "@nowly/env/server";
import { getDb } from "@/db/client";
import { customAsset, device } from "@nowly/database/schema/device";
import { migrateDatabase } from "@nowly/database/migrate";
import { and, eq, inArray } from "drizzle-orm";
import { customAssetsCronRoutes, customAssetsRoutes } from "@/features/custom-assets/custom-assets.routes";
import { CUSTOM_IMAGE_RETENTION_MS } from "@/features/custom-assets/custom-assets.service";
import { deleteDeviceData, exportDeviceData } from "@/features/device/device.service";
import { deriveDeviceToken } from "@/features/device/device-token";

const objectStorage = vi.hoisted(() => ({ send: vi.fn().mockResolvedValue({}) }));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const sdk = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...sdk,
    S3Client: class {
      send = objectStorage.send;
    }
  };
});

vi.mock("@nowly/env/server", async (importOriginal) => {
  const { serverEnv } = await importOriginal<typeof import("@nowly/env/server")>();
  return {
    serverEnv: {
      ...serverEnv,
      R2_PUBLIC_URL: "https://cdn.nowly.me",
      CUSTOM_ASSETS_CRON_SECRET: "integration-cron-only"
    }
  };
});

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const sha256 = createHash("sha256").update(PNG).digest("hex");
const deviceId = `custom-assets-test-${randomUUID()}`;
const otherDeviceId = `${deviceId}-other`;
const base = `/devices/${deviceId}/custom-assets/${sha256}`;
const headers = { "x-device-token": deriveDeviceToken(deviceId) };
const app = mount("/devices", customAssetsRoutes).route("/", customAssetsCronRoutes);

const db = () => getDb();

const assetCount = async (id: string) => (await db().select().from(customAsset).where(eq(customAsset.deviceId, id))).length;

const findDevice = async (id: string) => (await db().select().from(device).where(eq(device.deviceId, id)))[0] ?? null;

const setLastUsed = (lastUsedAt: Date) =>
  db()
    .update(customAsset)
    .set({ lastUsedAt })
    .where(and(eq(customAsset.deviceId, deviceId), eq(customAsset.sha256, sha256)));

const upload = () =>
  inject(app, {
    method: "PUT",
    url: base,
    headers: {
      ...headers,
      "content-type": "image/png"
    },
    payload: PNG
  });

beforeAll(async () => {
  await migrateDatabase(serverEnv.DATABASE_URL ?? "");
});

beforeEach(async () => {
  vi.clearAllMocks();
  objectStorage.send.mockResolvedValue({});
  await db()
    .delete(device)
    .where(inArray(device.deviceId, [deviceId, otherDeviceId]));
  await db()
    .insert(device)
    .values([
      { deviceId },
      { deviceId: otherDeviceId }
    ]);
});

afterAll(async () => {
  await db()
    .delete(device)
    .where(inArray(device.deviceId, [deviceId, otherDeviceId]));
});

describe("custom assets with PostgreSQL and isolated object storage", () => {
  it("makes repeated PUTs idempotent and refreshes last use", async () => {
    const first = await upload();
    expect(first.statusCode).toBe(200);
    expect(first.json().url).toMatch(/^https:\/\/cdn\.nowly\.me\/custom\//);
    const old = new Date(Date.now() - CUSTOM_IMAGE_RETENTION_MS);
    await setLastUsed(old);
    const second = await upload();
    expect(second.statusCode).toBe(200);
    expect(second.json().url).toBe(first.json().url);
    expect(await assetCount(deviceId)).toBe(1);
    expect(objectStorage.send).toHaveBeenCalledTimes(1);
    const [row] = await db()
      .select()
      .from(customAsset)
      .where(and(eq(customAsset.deviceId, deviceId), eq(customAsset.sha256, sha256)));
    expect(row.lastUsedAt.getTime()).toBeGreaterThan(old.getTime());
  });

  it("accepts simultaneous PUTs for the same device and hash", async () => {
    const responses = await Promise.all([
      upload(),
      upload()
    ]);
    expect(responses.map((response) => response.statusCode)).toEqual([200, 200]);
    expect(responses[0].json().url).toBe(responses[1].json().url);
    expect(await assetCount(deviceId)).toBe(1);
  });

  it("returns 404 on touch after deletion and permits re-upload", async () => {
    await upload();
    const touched = await inject(app, {
      method: "POST",
      url: `${base}/touch`,
      headers
    });
    expect(touched.statusCode).toBe(200);
    expect(
      (
        await inject(app, {
          method: "DELETE",
          url: base,
          headers
        })
      ).statusCode
    ).toBe(204);
    expect(
      (
        await inject(app, {
          method: "POST",
          url: `${base}/touch`,
          headers
        })
      ).statusCode
    ).toBe(404);
    expect(
      (
        await inject(app, {
          method: "DELETE",
          url: base,
          headers
        })
      ).statusCode
    ).toBe(204);
    expect((await upload()).statusCode).toBe(200);
  });

  it("requires the device token and does not allow access to another device", async () => {
    expect(
      (
        await inject(app, {
          method: "PUT",
          url: base,
          headers: { "content-type": "image/png" },
          payload: PNG
        })
      ).statusCode
    ).toBe(401);
    expect(
      (
        await inject(app, {
          method: "POST",
          url: `${base}/touch`,
          headers: { "x-device-token": deriveDeviceToken(otherDeviceId) }
        })
      ).statusCode
    ).toBe(401);
    expect(await assetCount(deviceId)).toBe(0);
  });

  it("cleans only expired assets and protects the cleanup endpoint", async () => {
    await upload();
    await setLastUsed(new Date(Date.now() - CUSTOM_IMAGE_RETENTION_MS - 1000));
    const otherBase = `/devices/${otherDeviceId}/custom-assets/${sha256}`;
    await inject(app, {
      method: "PUT",
      url: otherBase,
      headers: {
        "x-device-token": deriveDeviceToken(otherDeviceId),
        "content-type": "image/png"
      },
      payload: PNG
    });
    expect(
      (
        await inject(app, {
          method: "POST",
          url: "/custom-assets/cleanup"
        })
      ).statusCode
    ).toBe(401);
    const result = await inject(app, {
      method: "POST",
      url: "/custom-assets/cleanup",
      headers: { authorization: `Bearer ${serverEnv.CUSTOM_ASSETS_CRON_SECRET}` }
    });
    expect(result.statusCode).toBe(200);
    expect(result.json()).toEqual({ removed: 1 });
    expect(await assetCount(deviceId)).toBe(0);
    expect(await assetCount(otherDeviceId)).toBe(1);
  });

  it("exports image URLs and dates and erases the database rows and R2 files", async () => {
    const response = await upload();

    const data = await exportDeviceData(deviceId);
    expect(data?.customAssets).toEqual([
      expect.objectContaining({
        sha256,
        url: response.json().url,
        mime: "image/png",
        size: PNG.length,
        createdAt: expect.any(String),
        lastUsedAt: expect.any(String)
      })
    ]);
    objectStorage.send.mockClear();
    await deleteDeviceData(deviceId);
    expect(objectStorage.send).toHaveBeenCalledTimes(1);
    expect(objectStorage.send.mock.calls[0]?.[0].input.Key).toMatch(/^custom\//);
    expect(await assetCount(deviceId)).toBe(0);
    expect(await findDevice(deviceId)).toBeNull();
  });

  it("retains metadata for a retry when R2 erasure fails", async () => {
    await upload();
    objectStorage.send.mockRejectedValueOnce(new Error("Object storage unavailable"));
    await expect(deleteDeviceData(deviceId)).rejects.toThrow("Object storage unavailable");
    expect(await assetCount(deviceId)).toBe(1);
    expect(await findDevice(deviceId)).not.toBeNull();
  });
});