import { getDb } from "@/db/client";
import { publicProfile } from "@nowly/database/schema/account";
import { user } from "@nowly/database/schema/auth";
import { creatorPresence, presenceSubmission } from "@nowly/database/schema/creator";
import { presence, presenceLike } from "@nowly/database/schema/presence";
import { deriveHandleBase, handleCandidate, isValidPublicHandle } from "@nowly/shared";
import { isStaffRole } from "@nowly/shared/roles";
import type { PublicProfileBody } from "@nowly/shared/schemas";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

const PUBLIC_LIST_LIMIT = 60;
const UNIQUE_VIOLATION = "23505";
const HANDLE_ATTEMPTS = 50;
const DISCORD_CDN = "https://cdn.discordapp.com";
const DISCORD_BANNER_SIZE = 1024;

export type PublicProfileSettings = {
  enabled: boolean;
  handle: string | null;
  bio: string | null;
  showCreated: boolean;
  showLiked: boolean;
  links: string[];
};

export type PublicProfileView = {
  handle: string;
  name: string;
  username: string | null;
  verified: boolean;
  role: "admin" | "moderator" | null;
  image: string | null;
  banner: string | null;
  bio: string | null;
  links: string[];
  created: Array<{
    slug: string;
    name: string;
  }> | null;
  liked: Array<{
    slug: string;
    name: string;
  }> | null;
};

export class HandleTakenError extends Error {
  constructor() {
    super("HANDLE_TAKEN");
  }
}

const toSettings = (row: typeof publicProfile.$inferSelect | undefined): PublicProfileSettings => ({
  enabled: row?.enabled ?? false,
  handle: row?.handle ?? null,
  bio: row?.bio ?? null,
  showCreated: row?.showCreated ?? true,
  showLiked: row?.showLiked ?? true,
  links: row?.links ?? []
});

export const getPublicProfileSettings = async (userId: string): Promise<PublicProfileSettings> => {
  const [row] = await getDb().select().from(publicProfile).where(eq(publicProfile.userId, userId)).limit(1);
  return toSettings(row);
};

const isUniqueViolation = (error: unknown): boolean => {
  let current: unknown = error;

  for (let depth = 0; depth < 3 && current; depth += 1) {
    if (typeof current === "object" && "code" in current && current.code === UNIQUE_VIOLATION) return true;

    current = typeof current === "object" && "cause" in current ? current.cause : null;
  }

  return false;
};

const resolveHandle = async (userId: string): Promise<string> => {
  const db = getDb();
  const [existing] = await db.select({ handle: publicProfile.handle }).from(publicProfile).where(eq(publicProfile.userId, userId)).limit(1);

  if (existing) return existing.handle;

  const [owner] = await db
    .select({
      name: user.name,
      username: user.discordUsername
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const base = deriveHandleBase(owner?.username ?? owner?.name);

  for (let attempt = 0; attempt < HANDLE_ATTEMPTS; attempt += 1) {
    const candidate = handleCandidate(base, attempt);

    if (!isValidPublicHandle(candidate)) continue;

    const [taken] = await db.select({ userId: publicProfile.userId }).from(publicProfile).where(eq(publicProfile.handle, candidate)).limit(1);

    if (!taken) return candidate;
  }

  throw new HandleTakenError();
};

export const savePublicProfileSettings = async (userId: string, body: PublicProfileBody): Promise<PublicProfileSettings> => {
  const handle = await resolveHandle(userId);

  const values = {
    enabled: body.enabled,
    bio: body.bio,
    showCreated: body.showCreated,
    showLiked: body.showLiked,
    links: body.links,
    updatedAt: new Date()
  };

  try {
    const [row] = await getDb()
      .insert(publicProfile)
      .values({ userId, handle, ...values })
      .onConflictDoUpdate({
        target: publicProfile.userId,
        set: values
      })
      .returning();
    return toSettings(row);
  } catch (error) {
    if (isUniqueViolation(error)) throw new HandleTakenError();

    throw error;
  }
};

const publicRole = (role: string): "admin" | "moderator" | null => (role === "admin" || role === "moderator" ? role : null);

export const isVerifiedAccount = (verified: boolean, role: string): boolean => verified || isStaffRole(role);

const discordBannerUrl = (discordId: string | null, hash: string | null): string | null => {
  if (!discordId || !hash || !/^[a-z0-9_]+$/i.test(hash)) return null;

  const extension = hash.startsWith("a_") ? "gif" : "png";
  return `${DISCORD_CDN}/banners/${encodeURIComponent(discordId)}/${hash}.${extension}?size=${DISCORD_BANNER_SIZE}`;
};

const presenceName = (metadata: unknown, slug: string): string => {
  if (metadata && typeof metadata === "object" && "name" in metadata && typeof metadata.name === "string" && metadata.name) return metadata.name;

  return slug;
};

const createdPresences = async (userId: string) => {
  const db = getDb();
  const rows = await db
    .select({ slug: presenceSubmission.slug })
    .from(presenceSubmission)
    .where(and(eq(presenceSubmission.authorId, userId), eq(presenceSubmission.status, "published")))
    .orderBy(desc(presenceSubmission.publishedAt))
    .limit(PUBLIC_LIST_LIMIT);

  const slugs = [...new Set(rows.map((row) => row.slug))];

  if (!slugs.length) return [];

  const names = await db
    .select({
      slug: creatorPresence.slug,
      definition: creatorPresence.definition
    })
    .from(creatorPresence)
    .where(inArray(creatorPresence.slug, slugs));

  const byName = new Map(
    names.map((row) => [
      row.slug,
      presenceName(row.definition, row.slug)
    ])
  );
  return slugs.map((slug) => ({
    slug,
    name: byName.get(slug) ?? slug
  }));
};

const likedPresences = async (userId: string) => {
  const db = getDb();
  const rows = await db
    .select({
      slug: presence.slug,
      metadata: presence.metadata
    })
    .from(presenceLike)
    .innerJoin(presence, eq(presence.slug, presenceLike.slug))
    .where(and(eq(presenceLike.userId, userId), eq(presence.archived, false)))
    .orderBy(desc(presenceLike.likedAt))
    .limit(PUBLIC_LIST_LIMIT);
  return rows.map((row) => ({
    slug: row.slug,
    name: presenceName(row.metadata, row.slug)
  }));
};

export const getPublicProfile = async (handle: string): Promise<PublicProfileView | null> => {
  const [row] = await getDb()
    .select({
      profile: publicProfile,
      name: user.name,
      username: user.discordUsername,
      discordId: user.discordId,
      banner: user.discordBanner,
      verified: user.verified,
      role: user.role,
      image: user.image
    })
    .from(publicProfile)
    .innerJoin(user, eq(user.id, publicProfile.userId))
    .where(and(eq(publicProfile.handle, handle), eq(publicProfile.enabled, true)))
    .limit(1);

  if (!row) return null;

  const [created, liked] = await Promise.all([
    row.profile.showCreated ? createdPresences(row.profile.userId) : Promise.resolve(null),
    row.profile.showLiked ? likedPresences(row.profile.userId) : Promise.resolve(null)
  ]);
  return {
    handle: row.profile.handle,
    name: row.name,
    username: row.username,
    verified: isVerifiedAccount(row.verified, row.role),
    role: publicRole(row.role),
    image: row.image,
    banner: discordBannerUrl(row.discordId, row.banner),
    bio: row.profile.bio,
    links: row.profile.links,
    created,
    liked
  };
};