import { getDb } from "@/db/client";
import { device, devicePresence, presenceActiveDevice } from "@nowly/database/schema/device";
import { user } from "@nowly/database/schema/auth";
import { presence, presenceLike, presenceVersion } from "@nowly/database/schema/presence";
import { and, asc, count, countDistinct, desc, eq, gte, inArray, lt, ne, or } from "drizzle-orm";
import type { GlobalPresenceStats, PresenceListItem, PresenceMeta, PresenceStats, VersionEntry } from "./presence.types";

const ACTIVE_DEVICE_STALE_MS = 12 * 60 * 1000;

const iso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null;

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
};

const staleBefore = (): Date => new Date(Date.now() - ACTIVE_DEVICE_STALE_MS);

export const markActiveDevice = async (slug: string, deviceId: string, timestamp = Date.now()): Promise<void> => {
  const lastSeenAt = new Date(timestamp);
  await getDb()
    .insert(presenceActiveDevice)
    .values({ slug, deviceId, lastSeenAt })
    .onConflictDoUpdate({
      target: [presenceActiveDevice.slug, presenceActiveDevice.deviceId],
      set: { lastSeenAt }
    });
};

export const clearActiveDevice = async (slug: string, deviceId: string): Promise<void> => {
  await getDb()
    .delete(presenceActiveDevice)
    .where(and(eq(presenceActiveDevice.slug, slug), eq(presenceActiveDevice.deviceId, deviceId)));
};

export const clearActiveDevicesForDevice = async (deviceId: string): Promise<void> => {
  await getDb().delete(presenceActiveDevice).where(eq(presenceActiveDevice.deviceId, deviceId));
};

export const getActiveUsers = async (slug: string): Promise<number> => {
  const db = getDb();
  await db.delete(presenceActiveDevice).where(and(eq(presenceActiveDevice.slug, slug), lt(presenceActiveDevice.lastSeenAt, staleBefore())));
  const [row] = await db.select({ total: count() }).from(presenceActiveDevice).where(eq(presenceActiveDevice.slug, slug));
  return row.total;
};

export const getGlobalPresenceStats = async (): Promise<GlobalPresenceStats> => {
  const db = getDb();

  await db.delete(presenceActiveDevice).where(lt(presenceActiveDevice.lastSeenAt, staleBefore()));

  const [[users], [active], [installed]] = await Promise.all([
    db.select({ total: count() }).from(device),
    db
      .select({
        devices: countDistinct(presenceActiveDevice.deviceId),
        presences: count()
      })
      .from(presenceActiveDevice),
    db.select({ total: count() }).from(devicePresence).where(eq(devicePresence.installed, true))
  ]);

  return {
    totalUsers: users.total,
    activeUsers: active.devices,
    activePresenceCount: active.presences,
    installedPresenceCount: installed.total
  };
};

export const getPresenceStats = async (slug: string): Promise<PresenceStats> => {
  const db = getDb();
  const [row] = await db.select().from(presence).where(eq(presence.slug, slug)).limit(1);

  const [installs] = await db
    .select({ total: count() })
    .from(devicePresence)
    .where(and(eq(devicePresence.slug, slug), eq(devicePresence.installed, true)));

  return {
    totalInstalls: installs.total,
    activeUsers: await getActiveUsers(slug),
    likes: await getLikeCount(slug),
    version: row?.version ?? null,
    archived: row?.archived ?? false,
    addedAt: iso(row?.addedAt),
    lastUpdated: iso(row?.updatedAt)
  };
};

const linkedUserId = async (deviceId: string): Promise<string | null> => {
  const [row] = await getDb().select({ userId: device.userId }).from(device).where(eq(device.deviceId, deviceId)).limit(1);
  return row?.userId ?? null;
};

const likedBy = (slug: string, deviceId: string, userId: string | null) =>
  and(
    eq(presenceLike.slug, slug),
    userId
      ? or(eq(presenceLike.deviceId, deviceId), eq(presenceLike.userId, userId))
      : eq(presenceLike.deviceId, deviceId)
  );

export const likePresence = async (slug: string, deviceId: string): Promise<void> => {
  const db = getDb();
  const userId = await linkedUserId(deviceId);

  if (userId) {
    const [existing] = await db
      .select({ total: count() })
      .from(presenceLike)
      .where(and(eq(presenceLike.slug, slug), eq(presenceLike.userId, userId)));

    if (existing.total > 0) return;
  }

  await db.insert(presenceLike).values({ slug, deviceId, userId }).onConflictDoNothing();
};

export const unlikePresence = async (slug: string, deviceId: string): Promise<void> => {
  const userId = await linkedUserId(deviceId);
  await getDb()
    .delete(presenceLike)
    .where(likedBy(slug, deviceId, userId));
};

export const hasLikedPresence = async (slug: string, deviceId: string): Promise<boolean> => {
  const userId = await linkedUserId(deviceId);

  const [row] = await getDb()
    .select({ total: count() })
    .from(presenceLike)
    .where(likedBy(slug, deviceId, userId));
  return row.total > 0;
};

export const getLikeCount = async (slug: string): Promise<number> => {
  const [row] = await getDb().select({ total: count() }).from(presenceLike).where(eq(presenceLike.slug, slug));
  return row.total;
};

const toDate = (value?: Date | string): Date => (value instanceof Date ? value : value ? new Date(value) : new Date());

export const setUpdated = async (slug: string, date?: Date | string): Promise<void> => {
  const updatedAt = toDate(date);
  await getDb().insert(presence).values({ slug, updatedAt }).onConflictDoUpdate({
    target: presence.slug,
    set: { updatedAt }
  });
};

export const setAdded = async (slug: string, date?: Date | string): Promise<void> => {
  await getDb()
    .insert(presence)
    .values({
      slug,
      addedAt: toDate(date)
    })
    .onConflictDoNothing();
};

export const setVersion = async (slug: string, version: string, publishedAt?: Date): Promise<void> => {
  const updatedAt = publishedAt ?? new Date();
  await getDb().insert(presence).values({ slug, version, updatedAt }).onConflictDoUpdate({
    target: presence.slug,
    set: { version, updatedAt }
  });
};

export const addVersion = async (slug: string, entry: VersionEntry): Promise<void> => {
  const db = getDb();
  const publication = {
    changelog: entry.changelog,
    author: entry.author,
    authorGithub: entry.authorGithub,
    releaseAuthor: entry.releaseAuthor,
    releaseContributors: entry.releaseContributors,
    pr: entry.pr,
    source: entry.source,
    commitSha: entry.commitSha,
    changedFiles: entry.changedFiles,
    bundleSizeBytes: entry.bundleSizeBytes,
    bundleSizeLabel: entry.bundleSizeLabel,
    bundleSha256: entry.bundleSha256,
    versionType: entry.versionType,
    aiGeneratedChangelog: entry.aiGeneratedChangelog,
    createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(entry.timestamp),
    timestamp: new Date(entry.timestamp)
  };
  await db
    .insert(presence)
    .values({
      slug,
      version: entry.version
    })
    .onConflictDoNothing();
  await db
    .insert(presenceVersion)
    .values({
      slug,
      version: entry.version,
      ...publication
    })
    .onConflictDoUpdate({
      target: [presenceVersion.slug, presenceVersion.version],
      set: publication
    });
};

export const setPresenceMeta = async (slug: string, meta: PresenceMeta): Promise<void> => {
  await getDb()
    .insert(presence)
    .values({
      slug,
      metadata: meta
    })
    .onConflictDoUpdate({
      target: presence.slug,
      set: { metadata: meta }
    });
};

const isPresenceMeta = (value: unknown): value is PresenceMeta => Boolean(value) && typeof value === "object";

export const getPresenceMeta = async (slug: string): Promise<PresenceMeta | null> => {
  const [row] = await getDb().select({ metadata: presence.metadata }).from(presence).where(eq(presence.slug, slug)).limit(1);
  return row && isPresenceMeta(row.metadata) ? row.metadata : null;
};

const countBySlug = (
  rows: {
    slug: string;
    total: number;
  }[]
) => new Map(rows.map((row) => [row.slug, row.total]));

const discordIdOf = (meta: PresenceMeta): string | null => {
  const author: unknown = meta.author;
  return author && typeof author === "object" && "discord" in author && typeof author.discord === "string" && author.discord ? author.discord : null;
};

const discordAvatars = async (metas: PresenceMeta[]): Promise<Map<string, string>> => {
  const ids = [...new Set(metas.flatMap((meta) => discordIdOf(meta) ?? []))];

  if (!ids.length) return new Map();

  const rows = await getDb()
    .select({
      discordId: user.discordId,
      image: user.image
    })
    .from(user)
    .where(inArray(user.discordId, ids));
  return new Map(rows.flatMap((row) => (row.discordId && row.image ? [[row.discordId, row.image] as const] : [])));
};

const withAuthorAvatar = (meta: PresenceMeta, avatars: Map<string, string>): PresenceMeta => {
  const id = discordIdOf(meta);
  const avatar = id ? avatars.get(id) : undefined;
  return avatar ? { ...meta, author: { ...meta.author, avatar } } : meta;
};

export const getPresenceListData = async (): Promise<PresenceListItem[]> => {
  const db = getDb();

  const [presences, installCounts, activeCounts, likeCounts] = await Promise.all([
    db
      .select({
        slug: presence.slug,
        metadata: presence.metadata,
        version: presence.version,
        addedAt: presence.addedAt,
        updatedAt: presence.updatedAt
      })
      .from(presence)
      .where(eq(presence.archived, false)),
    db
      .select({
        slug: devicePresence.slug,
        total: count()
      })
      .from(devicePresence)
      .where(eq(devicePresence.installed, true))
      .groupBy(devicePresence.slug),
    db
      .select({
        slug: presenceActiveDevice.slug,
        total: count()
      })
      .from(presenceActiveDevice)
      .where(gte(presenceActiveDevice.lastSeenAt, staleBefore()))
      .groupBy(presenceActiveDevice.slug),
    db
      .select({
        slug: presenceLike.slug,
        total: count()
      })
      .from(presenceLike)
      .groupBy(presenceLike.slug)
  ]);

  const installMap = countBySlug(installCounts);
  const activeMap = countBySlug(activeCounts);
  const likeMap = countBySlug(likeCounts);
  const avatars = await discordAvatars(presences.flatMap((row) => (isPresenceMeta(row.metadata) ? [row.metadata] : [])));

  return presences.flatMap((row) =>
    isPresenceMeta(row.metadata)
      ? [
          {
            ...withAuthorAvatar(row.metadata, avatars),
            version: row.version || "",
            addedAt: iso(row.addedAt),
            lastUpdated: iso(row.updatedAt),
            totalInstalls: installMap.get(row.slug) ?? 0,
            activeUsers: activeMap.get(row.slug) ?? 0,
            likes: likeMap.get(row.slug) ?? 0
          }
        ]
      : []
  );
};

export const getAllPresenceSlugs = async (options: {
  includeArchived?: boolean;
} = {}): Promise<string[]> => {
  const rows = await getDb()
    .select({ slug: presence.slug })
    .from(presence)
    .where(options.includeArchived ? undefined : eq(presence.archived, false))
    .orderBy(asc(presence.slug));
  return rows.map((row) => row.slug);
};

export const getAllPresenceMetas = async (): Promise<
  {
    slug: string;
    metadata: PresenceMeta;
  }[]
> => {
  const rows = await getDb()
    .select({
      slug: presence.slug,
      metadata: presence.metadata
    })
    .from(presence)
    .where(eq(presence.archived, false));
  return rows.flatMap((row) =>
    isPresenceMeta(row.metadata)
      ? [
          {
            slug: row.slug,
            metadata: row.metadata
          }
        ]
      : []
  );
};

export const setArchived = async (slug: string, archived: boolean): Promise<boolean> => {
  const updated = await getDb()
    .update(presence)
    .set({ archived })
    .where(and(eq(presence.slug, slug), ne(presence.archived, archived)))
    .returning({ slug: presence.slug });
  return updated.length > 0;
};

export const getVersionHistory = async (slug: string): Promise<VersionEntry[]> => {
  const rows = await getDb().select().from(presenceVersion).where(eq(presenceVersion.slug, slug)).orderBy(desc(presenceVersion.timestamp));
  return rows.map((row) => ({
    version: row.version,
    changelog: row.changelog,
    author: row.author,
    authorGithub: row.authorGithub ?? undefined,
    releaseAuthor: row.releaseAuthor ?? undefined,
    releaseContributors: row.releaseContributors ?? undefined,
    pr: row.pr ?? undefined,
    source: row.source === "cli" || row.source === "pr" ? row.source : undefined,
    commitSha: row.commitSha ?? undefined,
    changedFiles: row.changedFiles ?? undefined,
    bundleSizeBytes: row.bundleSizeBytes ?? undefined,
    bundleSizeLabel: row.bundleSizeLabel ?? undefined,
    bundleSha256: row.bundleSha256 ?? undefined,
    versionType: row.versionType ?? undefined,
    aiGeneratedChangelog: row.aiGeneratedChangelog ?? undefined,
    createdAt: row.createdAt.toISOString(),
    timestamp: row.timestamp.getTime()
  }));
};