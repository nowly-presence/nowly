import { randomBytes } from "node:crypto";
import { getPrisma } from "@/db/client";
import { PUBLICATION_QUOTA, portableActivitySchema, publicationSchema, type PortableActivity } from "@nowly/shared/activity-publication";
import { ApiError } from "@/shared/errors";

export const readPublication = async (id: string) => {
  const row = await getPrisma().activityPublication.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          image: true
        }
      }
    }
  });

  if (!row) throw new ApiError(404, "NOT_FOUND");
  if (!row.published) throw new ApiError(404, "UNPUBLISHED");

  return publicationSchema.parse({
    id: row.id,
    revision: row.revision,
    activity: row.activity,
    author: {
      name: row.user.name.slice(0, 128),
      image: row.user.image
    }
  });
};

export const ownedPublication = async (userId: string, localKey: string) =>
  getPrisma().activityPublication.findUnique({
    where: {
      userId_localKey: { userId, localKey }
    },
    select: {
      id: true,
      revision: true,
      published: true
    }
  });

export const reservePublication = async (userId: string, localKey: string, activity: PortableActivity) => {
  const prisma = getPrisma();
  const verified = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "discord"
    },
    select: { id: true }
  });

  if (!verified) throw new ApiError(403, "DISCORD_REQUIRED");

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() }
    });
    const existing = await tx.activityPublication.findUnique({
      where: {
        userId_localKey: { userId, localKey }
      }
    });

    if (existing) {
      return {
        id: existing.id,
        revision: existing.revision,
        published: existing.published
      };
    }
    if (
      (await tx.activityPublication.count({
        where: { userId }
      })) >= PUBLICATION_QUOTA
    ) throw new ApiError(429, "PUBLICATION_LIMIT");

    const row = await tx.activityPublication.create({
      data: {
        id: randomBytes(16).toString("hex"),
        userId,
        localKey,
        revision: 0,
        published: false,
        activity: portableActivitySchema.parse(activity)
      }
    });
    return {
      id: row.id,
      revision: row.revision,
      published: row.published
    };
  });
};

export const writePublication = async (userId: string, localKey: string, activity: PortableActivity, baseRevision: number, id: string) => {
  const prisma = getPrisma();
  const verified = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "discord"
    },
    select: { id: true }
  });

  if (!verified) throw new ApiError(403, "DISCORD_REQUIRED");

  const result = await prisma.activityPublication.updateMany({
    where: {
      id,
      userId,
      localKey,
      revision: baseRevision
    },
    data: {
      activity: portableActivitySchema.parse(activity),
      revision: { increment: 1 },
      published: true,
      updatedAt: new Date()
    }
  });

  if (!result.count) throw new ApiError(409, "REVISION_CONFLICT");

  return {
    id,
    revision: baseRevision + 1
  };
};

export const unpublishActivity = async (userId: string, id: string, baseRevision: number) => {
  const row = await getPrisma().activityPublication.findFirst({
    where: { id, userId }
  });

  if (!row) throw new ApiError(404, "NOT_FOUND");

  const result = await getPrisma().activityPublication.updateMany({
    where: {
      id,
      userId,
      revision: baseRevision
    },
    data: {
      published: false,
      revision: { increment: 1 },
      updatedAt: new Date()
    }
  });

  if (!result.count) throw new ApiError(409, "REVISION_CONFLICT");

  return {
    id,
    revision: baseRevision + 1
  };
};