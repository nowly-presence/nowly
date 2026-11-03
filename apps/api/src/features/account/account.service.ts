import { getDb } from "@/db/client";
import { activityPublication } from "@nowly/database/schema/activity";
import { extensionToken, syncDocument } from "@nowly/database/schema/account";
import { account, user } from "@nowly/database/schema/auth";
import { device } from "@nowly/database/schema/device";
import { presenceLike } from "@nowly/database/schema/presence";
import { and, asc, desc, eq } from "drizzle-orm";
import { revokeDeviceExtensionTokens } from "./extension-token.service";

export const ACCOUNT_PROVIDERS = ["discord"] as const;

export type AccountProfile = {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
  githubLogin: string | null;
};

export type AccountDevice = {
  deviceId: string;
  browser: string | null;
  os: string | null;
  extensionVersion: string | null;
  lastSeenAt: string;
  current: boolean;
};

export const getAccountProfile = async (userId: string): Promise<AccountProfile | null> => {
  const [row] = await getDb()
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      discordId: user.discordId
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    githubLogin: null
  };
};

export const listAccountDevices = async (userId: string, currentDeviceId: string | null): Promise<AccountDevice[]> => {
  const devices = await getDb()
    .select({
      deviceId: device.deviceId,
      browser: device.browser,
      os: device.os,
      extensionVersion: device.extensionVersion,
      lastSeenAt: device.lastSeenAt
    })
    .from(device)
    .where(eq(device.userId, userId))
    .orderBy(desc(device.lastSeenAt));
  return devices.map((device) => ({
    deviceId: device.deviceId,
    browser: device.browser,
    os: device.os,
    extensionVersion: device.extensionVersion,
    lastSeenAt: device.lastSeenAt.toISOString(),
    current: device.deviceId === currentDeviceId
  }));
};

export const unlinkAccountDevice = async (userId: string, deviceId: string): Promise<boolean> => {
  const unlinked = await getDb()
    .update(device)
    .set({ userId: null })
    .where(and(eq(device.userId, userId), eq(device.deviceId, deviceId)))
    .returning({ deviceId: device.deviceId });
  await revokeDeviceExtensionTokens(userId, deviceId);
  return unlinked.length > 0;
};

export type AccountExport = {
  activityPublications: unknown[];
  profile: AccountProfile & {
    email: string;
    createdAt: string;
  };
  linkedAccounts: Array<{
    providerId: string;
    accountId: string;
    createdAt: string;
  }>;
  devices: AccountDevice[];
  extensionTokens: Array<{
    id: string;
    deviceId: string | null;
    scopes: string[];
    createdAt: string;
    expiresAt: string;
    lastUsedAt: string | null;
    revokedAt: string | null;
  }>;
  syncDocuments: Array<{
    key: string;
    value: unknown;
    version: number;
    updatedAt: string;
    updatedByDeviceId: string | null;
  }>;
  presenceLikes: Array<{
    slug: string;
    deviceId: string;
    likedAt: string;
  }>;
};

const iso = (date: Date | null): string | null => date?.toISOString() ?? null;

export const exportAccountData = async (userId: string): Promise<AccountExport | null> => {
  const db = getDb();
  const [[profile], accounts, tokens, documents, likes, devices, activityPublications] = await Promise.all([
    db.select().from(user).where(eq(user.id, userId)).limit(1),
    db
      .select({
        providerId: account.providerId,
        accountId: account.accountId,
        createdAt: account.createdAt
      })
      .from(account)
      .where(eq(account.userId, userId)),
    db.select().from(extensionToken).where(eq(extensionToken.userId, userId)).orderBy(asc(extensionToken.createdAt)),
    db.select().from(syncDocument).where(eq(syncDocument.userId, userId)).orderBy(asc(syncDocument.key)),
    db.select().from(presenceLike).where(eq(presenceLike.userId, userId)).orderBy(asc(presenceLike.likedAt)),
    listAccountDevices(userId, null),
    db.select().from(activityPublication).where(eq(activityPublication.userId, userId)).orderBy(asc(activityPublication.createdAt))
  ]);

  if (!profile) return null;

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
      discordId: profile.discordId,
      githubLogin: null,
      createdAt: profile.createdAt.toISOString()
    },
    activityPublications,
    linkedAccounts: accounts.map((account) => ({
      providerId: account.providerId,
      accountId: account.accountId,
      createdAt: account.createdAt.toISOString()
    })),
    devices,
    extensionTokens: tokens.map((token) => ({
      id: token.id,
      deviceId: token.deviceId,
      scopes: token.scopes ?? [],
      createdAt: token.createdAt.toISOString(),
      expiresAt: token.expiresAt.toISOString(),
      lastUsedAt: iso(token.lastUsedAt),
      revokedAt: iso(token.revokedAt)
    })),
    syncDocuments: documents.map((document) => ({
      key: document.key,
      value: document.value,
      version: document.version,
      updatedAt: document.updatedAt.toISOString(),
      updatedByDeviceId: document.updatedByDeviceId
    })),
    presenceLikes: likes.map((like) => ({
      slug: like.slug,
      deviceId: like.deviceId,
      likedAt: like.likedAt.toISOString()
    }))
  };
};

export const deleteAccountData = async (userId: string): Promise<void> => {
  await getDb().transaction(async (tx) => {
    await tx.update(device).set({ userId: null }).where(eq(device.userId, userId));
    await tx.update(presenceLike).set({ userId: null }).where(eq(presenceLike.userId, userId));
    await tx.delete(syncDocument).where(eq(syncDocument.userId, userId));
    await tx.delete(extensionToken).where(eq(extensionToken.userId, userId));
    await tx.delete(user).where(eq(user.id, userId));
  });
};