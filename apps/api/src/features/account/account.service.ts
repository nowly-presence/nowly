import { eraseReporterReports, exportReporterReports, type ExportedReport } from "@/features/presence-reports/report.service";
import { getDb } from "@/db/client";
import { activityPublication } from "@nowly/database/schema/activity";
import { extensionToken, syncDocument } from "@nowly/database/schema/account";
import { account, user } from "@nowly/database/schema/auth";
import { device } from "@nowly/database/schema/device";
import { presence, presenceLike } from "@nowly/database/schema/presence";
import { and, asc, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { eraseAuthoredSubmissionImages, exportAuthoredSubmissions } from "@/features/presence-submissions/submission-detail.service";
import { listActorActions, type AuditEventView } from "@/features/admin/audit.service";
import { capabilitiesOf, type AdminCapability } from "@nowly/shared/roles";
import { syncCustomActivitiesSchema, syncPresencesSchema } from "@nowly/shared/schemas";
import { getPublicProfileSettings, isVerifiedAccount, type PublicProfileSettings } from "@/features/public-profile/public-profile.service";
import { linkedDiscordId } from "./discord-link.service";
import { revokeDeviceExtensionTokens } from "./extension-token.service";

export const ACCOUNT_PROVIDERS = ["discord"] as const;

export type AccountProfile = {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
  githubLogin: string | null;
  role: string;
  verified: boolean;
  capabilities: AdminCapability[];
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
      discordId: user.discordId,
      role: user.role,
      verified: user.verified
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) return null;

  const discordId = row.discordId ?? (await linkedDiscordId(userId));

  return {
    ...row,
    discordId,
    verified: isVerifiedAccount(row.verified, row.role),
    githubLogin: null,
    capabilities: capabilitiesOf(row.role)
  };
};

export type AccountPresence = {
  slug: string;
  name: string;
  enabled: boolean;
  installedAt: number;
};

const catalogName = (metadata: unknown, slug: string): string => {
  if (metadata && typeof metadata === "object" && "name" in metadata && typeof metadata.name === "string" && metadata.name) return metadata.name;

  return slug;
};

export const listAccountPresences = async (userId: string): Promise<AccountPresence[]> => {
  const db = getDb();
  const [row] = await db
    .select({ value: syncDocument.value })
    .from(syncDocument)
    .where(and(eq(syncDocument.userId, userId), eq(syncDocument.key, "presences")))
    .limit(1);

  const parsed = syncPresencesSchema.safeParse(row?.value);

  if (!parsed.success || !parsed.data.length) return [];

  const catalog = await db
    .select({
      slug: presence.slug,
      metadata: presence.metadata
    })
    .from(presence)
    .where(
      inArray(
        presence.slug,
        parsed.data.map((entry) => entry.slug)
      )
    );

  const names = new Map(
    catalog.map((entry) => [
      entry.slug,
      catalogName(entry.metadata, entry.slug)
    ])
  );
  return parsed.data.map(({ slug, enabled, installedAt }) => ({
    slug,
    name: names.get(slug) ?? slug,
    enabled,
    installedAt
  }));
};

export type AccountCustomActivity = {
  id: string;
  name: string;
  details: string;
  state: string;
  updatedAt: number;
};

export const listAccountCustomActivities = async (userId: string): Promise<AccountCustomActivity[]> => {
  const [row] = await getDb()
    .select({ value: syncDocument.value })
    .from(syncDocument)
    .where(and(eq(syncDocument.userId, userId), eq(syncDocument.key, "customActivities")))
    .limit(1);

  const parsed = syncCustomActivitiesSchema.safeParse(row?.value);

  if (!parsed.success) return [];

  return parsed.data.items.map(({ id, name, details, state, updatedAt }) => ({ id, name, details, state, updatedAt }));
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

export const unlinkAllAccountDevices = async (userId: string, keepDeviceId: string | null): Promise<number> => {
  const db = getDb();
  const scope = keepDeviceId
    ? and(eq(device.userId, userId), ne(device.deviceId, keepDeviceId))
    : eq(device.userId, userId);
  const unlinked = await db.update(device).set({ userId: null }).where(scope).returning({ deviceId: device.deviceId });

  const tokenScope = keepDeviceId
    ? and(eq(extensionToken.userId, userId), isNull(extensionToken.revokedAt), or(isNull(extensionToken.deviceId), ne(extensionToken.deviceId, keepDeviceId)))
    : and(eq(extensionToken.userId, userId), isNull(extensionToken.revokedAt));
  await db.update(extensionToken).set({ revokedAt: new Date() }).where(tokenScope);
  return unlinked.length;
};

export type AccountExport = {
  activityPublications: unknown[];
  adminActions: AuditEventView[];
  presenceSubmissions: unknown[];
  publicProfile: PublicProfileSettings;
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
  presenceReports: ExportedReport[];
  presenceLikes: Array<{
    slug: string;
    deviceId: string;
    likedAt: string;
  }>;
};

const iso = (date: Date | null): string | null => date?.toISOString() ?? null;

export const exportAccountData = async (userId: string): Promise<AccountExport | null> => {
  const db = getDb();
  const [
    [profile],
    accounts,
    tokens,
    documents,
    likes,
    devices,
    activityPublications,
    adminActions,
    presenceSubmissions,
    publicProfileSettings,
    presenceReports
  ] = await Promise.all([
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
    db.select().from(activityPublication).where(eq(activityPublication.userId, userId)).orderBy(asc(activityPublication.createdAt)),
    listActorActions(userId),
    exportAuthoredSubmissions(userId),
    getPublicProfileSettings(userId),
    exportReporterReports(userId)
  ]);

  if (!profile) return null;

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
      discordId: profile.discordId,
      verified: isVerifiedAccount(profile.verified, profile.role),
      githubLogin: null,
      role: profile.role,
      capabilities: capabilitiesOf(profile.role),
      createdAt: profile.createdAt.toISOString()
    },
    activityPublications,
    adminActions,
    presenceSubmissions,
    presenceReports,
    publicProfile: publicProfileSettings,
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
  await eraseAuthoredSubmissionImages(userId);
  await eraseReporterReports(userId);
  await getDb().transaction(async (tx) => {
    await tx.update(device).set({ userId: null }).where(eq(device.userId, userId));
    await tx.update(presenceLike).set({ userId: null }).where(eq(presenceLike.userId, userId));
    await tx.delete(syncDocument).where(eq(syncDocument.userId, userId));
    await tx.delete(extensionToken).where(eq(extensionToken.userId, userId));
    await tx.delete(user).where(eq(user.id, userId));
  });
};