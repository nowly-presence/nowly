import { getDb, hasDatabase } from "@/db/client";
import { customAsset, device, devicePresence, presenceActiveDevice } from "@nowly/database/schema/device";
import { presenceLike } from "@nowly/database/schema/presence";
import { and, asc, eq, or } from "drizzle-orm";
import { cleanText } from "@nowly/shared";
import { deleteCustomAssetFile } from "@/features/custom-assets/custom-assets.service";
import { publicObjectUrl } from "@/shared/object-storage";

type DeviceSyncPresence = {
  slug: string;
  version?: string | null;
  enabled?: boolean;
  installed?: boolean;
};

export type DeviceSyncInput = {
  deviceId: string;
  extensionVersion?: string;
  nativeVersion?: string;
  browser?: string;
  os?: string;
  locale?: string;
  presences?: DeviceSyncPresence[];
};

const upsertDevice = async (input: DeviceSyncInput): Promise<void> => {
  if (!hasDatabase()) return;

  const details = {
    extensionVersion: cleanText(input.extensionVersion),
    nativeVersion: cleanText(input.nativeVersion),
    browser: cleanText(input.browser, 60),
    os: cleanText(input.os, 60),
    locale: cleanText(input.locale, 20)
  };
  await getDb()
    .insert(device)
    .values({
      deviceId: input.deviceId,
      ...details
    })
    .onConflictDoUpdate({
      target: device.deviceId,
      set: {
        ...details,
        lastSeenAt: new Date()
      }
    });
};

export type DeviceExport = {
  device: {
    deviceId: string;
    extensionVersion: string | null;
    nativeVersion: string | null;
    browser: string | null;
    os: string | null;
    locale: string | null;
    firstSeenAt: string;
    lastSeenAt: string;
  } | null;
  presences: Array<{
    slug: string;
    installed: boolean;
    enabled: boolean;
    installedVersion: string | null;
  }>;
  presenceLikes: Array<{
    slug: string;
    likedAt: string;
  }>;
  customAssets: Array<{
    sha256: string;
    url: string;
    mime: string;
    size: number;
    createdAt: string;
    lastUsedAt: string;
  }>;
  linkedToAccount: boolean;
};

export const deviceExists = async (deviceId: string): Promise<boolean> => {
  if (!hasDatabase()) return false;

  const [row] = await getDb().select({ deviceId: device.deviceId }).from(device).where(eq(device.deviceId, deviceId)).limit(1);
  return row !== undefined;
};

export const exportDeviceData = async (deviceId: string): Promise<DeviceExport | null> => {
  if (!hasDatabase()) return null;

  const db = getDb();
  const [[row], presences, presenceLikes, customAssets] = await Promise.all([
    db.select().from(device).where(eq(device.deviceId, deviceId)).limit(1),
    db.select().from(devicePresence).where(eq(devicePresence.deviceId, deviceId)),
    db.select().from(presenceLike).where(eq(presenceLike.deviceId, deviceId)),
    db.select().from(customAsset).where(eq(customAsset.deviceId, deviceId))
  ]);

  if (!row) return null;

  return {
    device: {
      deviceId: row.deviceId,
      extensionVersion: row.extensionVersion,
      nativeVersion: row.nativeVersion,
      browser: row.browser,
      os: row.os,
      locale: row.locale,
      firstSeenAt: row.firstSeenAt.toISOString(),
      lastSeenAt: row.lastSeenAt.toISOString()
    },
    presences: presences.map((presence) => ({
      slug: presence.slug,
      installed: presence.installed,
      enabled: presence.enabled,
      installedVersion: presence.installedVersion
    })),
    presenceLikes: presenceLikes.map((like) => ({
      slug: like.slug,
      likedAt: like.likedAt.toISOString()
    })),
    customAssets: customAssets.map((asset) => ({
      sha256: asset.sha256,
      url: publicObjectUrl(asset.key),
      mime: asset.mime,
      size: asset.size,
      createdAt: asset.createdAt.toISOString(),
      lastUsedAt: asset.lastUsedAt.toISOString()
    })),
    linkedToAccount: row.userId !== null
  };
};

export const deleteDeviceData = async (deviceId: string): Promise<void> => {
  if (!hasDatabase()) return;

  const db = getDb();
  const assets = await db.select().from(customAsset).where(eq(customAsset.deviceId, deviceId));

  for (const asset of assets) {
    await deleteCustomAssetFile(asset.key);
  }

  await db.transaction(async (tx) => {
    await tx.delete(customAsset).where(eq(customAsset.deviceId, deviceId));
    await tx.delete(presenceLike).where(eq(presenceLike.deviceId, deviceId));
    await tx.delete(devicePresence).where(eq(devicePresence.deviceId, deviceId));
    await tx.delete(presenceActiveDevice).where(eq(presenceActiveDevice.deviceId, deviceId));
    await tx.delete(device).where(eq(device.deviceId, deviceId));
  });
};

export const syncDevice = async (input: DeviceSyncInput): Promise<void> => {
  await upsertDevice(input);

  if (!hasDatabase() || !input.presences?.length) return;

  const db = getDb();

  for (const presence of input.presences) {
    const slug = cleanText(presence.slug, 80)?.toLowerCase();

    if (!slug) continue;

    const installed = presence.installed !== false;
    const enabled = installed && presence.enabled !== false;
    const uninstalledAt = installed ? null : new Date();
    const installedVersion = cleanText(presence.version ?? undefined, 60);

    await db
      .insert(devicePresence)
      .values({
        deviceId: input.deviceId,
        slug,
        installedVersion,
        installed,
        enabled,
        uninstalledAt
      })
      .onConflictDoUpdate({
        target: [devicePresence.deviceId, devicePresence.slug],
        set: {
          installedVersion,
          installed,
          enabled,
          updatedAt: new Date(),
          uninstalledAt
        }
      });
  }
};

export const linkDeviceToUser = async (deviceId: string, userId: string): Promise<void> => {
  const db = getDb();
  await db.insert(device).values({ deviceId, userId }).onConflictDoUpdate({
    target: device.deviceId,
    set: { userId }
  });
  await db.update(presenceLike).set({ userId }).where(eq(presenceLike.deviceId, deviceId));

  const likes = await db
    .select({
      slug: presenceLike.slug,
      deviceId: presenceLike.deviceId
    })
    .from(presenceLike)
    .where(eq(presenceLike.userId, userId))
    .orderBy(asc(presenceLike.likedAt));

  const kept = new Set<string>();
  const duplicates = likes.filter((like) => {
    if (kept.has(like.slug)) return true;

    kept.add(like.slug);
    return false;
  });

  if (duplicates.length === 0) return;

  await db.delete(presenceLike).where(or(...duplicates.map((like) => and(eq(presenceLike.slug, like.slug), eq(presenceLike.deviceId, like.deviceId)))));
};