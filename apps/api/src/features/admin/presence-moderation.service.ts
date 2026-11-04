import { getDb } from "@/db/client";
import { removeCreatorImages, storedKeys } from "@/features/presence-submissions/submission-storage";
import { hasObjectStorage, objectStorage } from "@/shared/object-storage";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { serverEnv } from "@nowly/env/server";
import { creatorPresence, presenceSubmission, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { devicePresence, presenceActiveDevice } from "@nowly/database/schema/device";
import { presence, presenceLike } from "@nowly/database/schema/presence";
import { asc, eq, inArray } from "drizzle-orm";
import { recordAdminAction, type AuditActor } from "./audit.service";

const LIST_PAGE = 1_000;

const catalogKeys = async (slug: string): Promise<string[]> => {
  const storage = objectStorage();
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const page = await storage.send(
      new ListObjectsV2Command({
        Bucket: serverEnv.R2_BUCKET,
        Prefix: `presences/${slug}/`,
        MaxKeys: LIST_PAGE,
        ContinuationToken: token
      })
    );
    keys.push(...(page.Contents ?? []).flatMap((entry) => (entry.Key ? [entry.Key] : [])));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  return keys;
};

export const listHiddenPresences = async (): Promise<Array<{
  slug: string;
  name: string;
}>> => {
  const rows = await getDb().select({ slug: presence.slug, metadata: presence.metadata }).from(presence).where(eq(presence.archived, true)).orderBy(asc(presence.slug));
  return rows.map((row) => {
    const name = typeof row.metadata === "object" && row.metadata && "name" in row.metadata && typeof row.metadata.name === "string" ? row.metadata.name : row.slug;
    return {
      slug: row.slug,
      name
    };
  });
};

export const setPresenceHidden = async (
  actor: AuditActor,
  slug: string,
  hidden: boolean
): Promise<{
  found: boolean;
  changed: boolean;
}> =>
  getDb().transaction(async (tx) => {
    const [row] = await tx.select({ archived: presence.archived }).from(presence).where(eq(presence.slug, slug)).for("update");

    if (!row) return {
      found: false,
      changed: false
    };

    if (row.archived === hidden) return {
      found: true,
      changed: false
    };

    await tx.update(presence).set({ archived: hidden }).where(eq(presence.slug, slug));
    await recordAdminAction(tx, actor, {
      action: hidden ? "presence.hide" : "presence.show",
      targetType: "presence",
      targetId: slug
    });
    return {
      found: true,
      changed: true
    };
  });

export const deletePresenceCompletely = async (actor: AuditActor, slug: string): Promise<{
  found: boolean;
}> => {
  const submissionKeys: string[] = [];
  const found = await getDb().transaction(async (tx) => {
    const [row] = await tx.select({ slug: presence.slug }).from(presence).where(eq(presence.slug, slug)).for("update");

    const [creator] = await tx.select({ slug: creatorPresence.slug }).from(creatorPresence).where(eq(creatorPresence.slug, slug)).limit(1);

    if (!row && !creator) return false;

    const submissions = await tx.select({ id: presenceSubmission.id }).from(presenceSubmission).where(eq(presenceSubmission.slug, slug));
    const ids = submissions.map((entry) => entry.id);

    if (ids.length) {
      const revisions = await tx
        .select({ assets: presenceSubmissionRevision.assets })
        .from(presenceSubmissionRevision)
        .where(inArray(presenceSubmissionRevision.submissionId, ids));
      submissionKeys.push(...revisions.flatMap((revision) => storedKeys(revision.assets)));
    }

    await tx.delete(presenceSubmission).where(eq(presenceSubmission.slug, slug));
    await tx.delete(creatorPresence).where(eq(creatorPresence.slug, slug));
    await tx.delete(presenceLike).where(eq(presenceLike.slug, slug));
    await tx.delete(presenceActiveDevice).where(eq(presenceActiveDevice.slug, slug));
    await tx.delete(devicePresence).where(eq(devicePresence.slug, slug));
    await tx.delete(presence).where(eq(presence.slug, slug));
    await recordAdminAction(tx, actor, {
      action: "presence.delete",
      targetType: "presence",
      targetId: slug,
      details: { submissions: ids.length }
    });
    return true;
  });

  if (found && hasObjectStorage()) {
    const keys = [...submissionKeys, ...(await catalogKeys(slug).catch(() => []))];
    await removeCreatorImages(keys).catch(() => undefined);
  }

  return { found };
};