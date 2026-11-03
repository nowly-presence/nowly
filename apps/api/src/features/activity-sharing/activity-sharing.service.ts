import { randomBytes } from "node:crypto";
import { getDb } from "@/db/client";
import { activityPublication } from "@nowly/database/schema/activity";
import { account, user } from "@nowly/database/schema/auth";
import { PUBLICATION_QUOTA, portableActivitySchema, publicationSchema, type PortableActivity } from "@nowly/shared/activity-publication";
import { and, count, eq, sql } from "drizzle-orm";
import { ApiError } from "@/shared/errors";

const AUTHOR_NAME_MAX_LENGTH = 128;
const PUBLICATION_ID_BYTES = 16;

export const readPublication = async (id: string) => {
  const [row] = await getDb()
    .select({
      id: activityPublication.id,
      revision: activityPublication.revision,
      published: activityPublication.published,
      activity: activityPublication.activity,
      authorName: user.name,
      authorImage: user.image
    })
    .from(activityPublication)
    .innerJoin(user, eq(user.id, activityPublication.userId))
    .where(eq(activityPublication.id, id))
    .limit(1);

  if (!row) throw new ApiError(404, "NOT_FOUND");
  if (!row.published) throw new ApiError(404, "UNPUBLISHED");

  return publicationSchema.parse({
    id: row.id,
    revision: row.revision,
    activity: row.activity,
    author: {
      name: row.authorName.slice(0, AUTHOR_NAME_MAX_LENGTH),
      image: row.authorImage
    }
  });
};

export const ownedPublication = async (userId: string, localKey: string) => {
  const [row] = await getDb()
    .select({
      id: activityPublication.id,
      revision: activityPublication.revision,
      published: activityPublication.published
    })
    .from(activityPublication)
    .where(and(eq(activityPublication.userId, userId), eq(activityPublication.localKey, localKey)))
    .limit(1);
  return row ?? null;
};

const requireDiscord = async (userId: string): Promise<void> => {
  const [verified] = await getDb()
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "discord")))
    .limit(1);

  if (!verified) throw new ApiError(403, "DISCORD_REQUIRED");
};

export const reservePublication = async (userId: string, localKey: string, activity: PortableActivity) => {
  await requireDiscord(userId);

  return getDb().transaction(async (tx) => {
    await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for("update");

    const [existing] = await tx
      .select({
        id: activityPublication.id,
        revision: activityPublication.revision,
        published: activityPublication.published
      })
      .from(activityPublication)
      .where(and(eq(activityPublication.userId, userId), eq(activityPublication.localKey, localKey)))
      .limit(1);

    if (existing) return existing;

    const [{ total }] = await tx.select({ total: count() }).from(activityPublication).where(eq(activityPublication.userId, userId));

    if (total >= PUBLICATION_QUOTA) throw new ApiError(429, "PUBLICATION_LIMIT");

    const [row] = await tx
      .insert(activityPublication)
      .values({
        id: randomBytes(PUBLICATION_ID_BYTES).toString("hex"),
        userId,
        localKey,
        revision: 0,
        published: false,
        activity: portableActivitySchema.parse(activity)
      })
      .returning({
        id: activityPublication.id,
        revision: activityPublication.revision,
        published: activityPublication.published
      });
    return row;
  });
};

export const writePublication = async (userId: string, localKey: string, activity: PortableActivity, baseRevision: number, id: string) => {
  await requireDiscord(userId);

  const updated = await getDb()
    .update(activityPublication)
    .set({
      activity: portableActivitySchema.parse(activity),
      revision: sql`${activityPublication.revision} + 1`,
      published: true,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(activityPublication.id, id),
        eq(activityPublication.userId, userId),
        eq(activityPublication.localKey, localKey),
        eq(activityPublication.revision, baseRevision)
      )
    )
    .returning({ id: activityPublication.id });

  if (!updated.length) throw new ApiError(409, "REVISION_CONFLICT");

  return {
    id,
    revision: baseRevision + 1
  };
};

export const unpublishActivity = async (userId: string, id: string, baseRevision: number) => {
  const db = getDb();
  const [row] = await db
    .select({ id: activityPublication.id })
    .from(activityPublication)
    .where(and(eq(activityPublication.id, id), eq(activityPublication.userId, userId)))
    .limit(1);

  if (!row) throw new ApiError(404, "NOT_FOUND");

  const updated = await db
    .update(activityPublication)
    .set({
      published: false,
      revision: sql`${activityPublication.revision} + 1`,
      updatedAt: new Date()
    })
    .where(and(eq(activityPublication.id, id), eq(activityPublication.userId, userId), eq(activityPublication.revision, baseRevision)))
    .returning({ id: activityPublication.id });

  if (!updated.length) throw new ApiError(409, "REVISION_CONFLICT");

  return {
    id,
    revision: baseRevision + 1
  };
};