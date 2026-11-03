import { getDb } from "@/db/client";
import { user } from "@nowly/database/schema/auth";
import { creatorPresence, presenceSubmission, presenceSubmissionEvent, presenceSubmissionReview, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { toSummary } from "./submission.service";
import { assetUrls, removeCreatorImages, storedKeys } from "./submission-storage";

export const QUEUE_LIMIT = 100;

const QUEUE_STATUSES = ["submitted", "approved"];

const names = async (ids: Array<string | null>): Promise<Map<string, string>> => {
  const known = [...new Set(ids.filter((id): id is string => Boolean(id)))];

  if (!known.length) return new Map();

  const rows = await getDb()
    .select({
      id: user.id,
      name: user.name
    })
    .from(user)
    .where(inArray(user.id, known));
  return new Map(rows.map((row) => [row.id, row.name]));
};

const person = (id: string | null, byId: Map<string, string>) => (id ? { id, name: byId.get(id) ?? null } : null);

export const getSubmissionAuthorId = async (id: string): Promise<string | null> => {
  const [row] = await getDb().select({ authorId: presenceSubmission.authorId }).from(presenceSubmission).where(eq(presenceSubmission.id, id)).limit(1);
  return row?.authorId ?? null;
};

export const getSubmissionDetail = async (id: string) => {
  const db = getDb();
  const [row] = await db.select().from(presenceSubmission).where(eq(presenceSubmission.id, id)).limit(1);

  if (!row) return null;

  const [revisions, reviews, events] = await Promise.all([
    db.select().from(presenceSubmissionRevision).where(eq(presenceSubmissionRevision.submissionId, id)).orderBy(asc(presenceSubmissionRevision.number)),
    db.select().from(presenceSubmissionReview).where(eq(presenceSubmissionReview.submissionId, id)).orderBy(asc(presenceSubmissionReview.createdAt)),
    db.select().from(presenceSubmissionEvent).where(eq(presenceSubmissionEvent.submissionId, id)).orderBy(asc(presenceSubmissionEvent.createdAt))
  ]);

  const byId = await names([
    row.authorId,
    ...revisions.map((item) => item.authorId),
    ...reviews.map((item) => item.reviewerId),
    ...events.map((item) => item.actorId)
  ]);

  const latest = revisions.at(-1);

  return {
    ...toSummary(row),
    kind: row.kind,
    slug: row.slug,
    baseRevision: row.baseRevision,
    translate: row.translate,
    author: person(row.authorId, byId),
    createdAt: row.createdAt.toISOString(),
    definition: latest?.definition ?? null,
    files: latest?.files ?? [],
    assets: assetUrls(latest?.assets),
    pullRequest: {
      number: row.prNumber,
      url: row.prUrl,
      revision: row.prRevision,
      error: row.prError
    },
    revisions: revisions.map((item) => ({
      number: item.number,
      author: person(item.authorId, byId),
      changes: item.changes,
      createdAt: item.createdAt.toISOString()
    })),
    reviews: reviews.map((item) => ({
      id: item.id,
      revision: item.revision,
      reviewer: person(item.reviewerId, byId),
      verdict: item.verdict,
      message: item.message,
      comments: item.comments,
      createdAt: item.createdAt.toISOString()
    })),
    history: events.map((item) => ({
      type: item.type,
      status: item.status,
      revision: item.revision,
      actor: person(item.actorId, byId),
      note: item.note,
      details: item.details,
      createdAt: item.createdAt.toISOString()
    }))
  };
};

export const listReviewQueue = async () => {
  const rows = await getDb()
    .select()
    .from(presenceSubmission)
    .where(inArray(presenceSubmission.status, QUEUE_STATUSES))
    .orderBy(asc(presenceSubmission.updatedAt))
    .limit(QUEUE_LIMIT);

  const byId = await names(rows.map((row) => row.authorId));
  return rows.map((row) => ({
    ...toSummary(row),
    kind: row.kind,
    slug: row.slug,
    author: person(row.authorId, byId)
  }));
};

export const exportAuthoredSubmissions = async (userId: string) => {
  const db = getDb();
  const rows = await db.select().from(presenceSubmission).where(eq(presenceSubmission.authorId, userId)).orderBy(desc(presenceSubmission.createdAt));
  return Promise.all(rows.map(async (row) => getSubmissionDetail(row.id)));
};

export const eraseAuthoredSubmissionImages = async (userId: string): Promise<void> => {
  const rows = await getDb()
    .select({ assets: presenceSubmissionRevision.assets })
    .from(presenceSubmissionRevision)
    .innerJoin(presenceSubmission, eq(presenceSubmission.id, presenceSubmissionRevision.submissionId))
    .where(eq(presenceSubmission.authorId, userId));
  await removeCreatorImages(rows.flatMap((row) => storedKeys(row.assets)));
};

export const getCreatorPresence = async (slug: string) => {
  const [row] = await getDb().select().from(creatorPresence).where(eq(creatorPresence.slug, slug)).limit(1);

  if (!row) return null;

  return {
    slug: row.slug,
    revision: row.revision,
    definition: row.definition,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
};