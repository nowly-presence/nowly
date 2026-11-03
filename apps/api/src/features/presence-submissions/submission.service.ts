import { getDb } from "@/db/client";
import { user } from "@nowly/database/schema/auth";
import { creatorPresence, presenceSubmission, presenceSubmissionEvent, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { presence } from "@nowly/database/schema/presence";
import { buildTextFiles, diffDefinitions, normalizeDraft, parseCreatorDefinition, presenceSlug, validateDraft, type CreatorDefinition, type CreatorDraft } from "@nowly/presence-creator";
import { and, desc, eq, inArray } from "drizzle-orm";
import { randomBytes, randomUUID } from "node:crypto";
import { SubmissionError } from "./submission-errors";
import { EDITABLE_STATUSES, isOneOf, OPEN_STATUSES } from "./submission-status";

const SUBMISSION_ID_BYTES = 12;
const ISSUES_IN_MESSAGE = 3;
const SERVER_CHECKED_LATER_STEP = "visuals";

export type SubmissionSummary = {
  id: string;
  status: string;
  revision: number;
  updatedAt: string;
  prUrl?: string;
  note?: string;
};

export const toSummary = (row: typeof presenceSubmission.$inferSelect): SubmissionSummary => ({
  id: row.id,
  status: row.status,
  revision: row.revision,
  updatedAt: row.updatedAt.toISOString(),
  ...(row.prUrl ? { prUrl: row.prUrl } : {}),
  ...(row.note ? { note: row.note } : {})
});

const asDraft = (definition: CreatorDefinition): CreatorDraft =>
  normalizeDraft({
    ...definition,
    assets: { thumbnailRightsConfirmed: true }
  });

const assertNoOtherPending = async (slug: string, authorId: string, draftId: string): Promise<void> => {
  const pending = await getDb()
    .select({
      slug: presenceSubmission.slug,
      authorId: presenceSubmission.authorId,
      draftId: presenceSubmission.draftId
    })
    .from(presenceSubmission)
    .where(and(eq(presenceSubmission.slug, slug), inArray(presenceSubmission.status, [...OPEN_STATUSES])));

  if (pending.some((row) => row.authorId !== authorId || row.draftId !== draftId)) {
    throw new SubmissionError("SUBMISSION_PENDING", "Another submission for this presence is already under review.");
  }
};

export const submitPresence = async (input: {
  userId: string;
  definition: unknown;
  translate: boolean;
}): Promise<SubmissionSummary> => {
  const db = getDb();
  const [author] = await db
    .select({
      name: user.name,
      discordId: user.discordId
    })
    .from(user)
    .where(eq(user.id, input.userId))
    .limit(1);

  if (!author?.discordId) throw new SubmissionError("CREATOR_REQUIRED", "Link a Discord account to publish presences.");

  const parsed = parseCreatorDefinition(input.definition);

  if (!parsed) throw new SubmissionError("INVALID_DEFINITION", "The presence definition is invalid.");

  const definition: CreatorDefinition = {
    ...parsed,
    author: {
      name: author.name,
      discord: author.discordId
    }
  };
  const slug = presenceSlug(definition.name);
  const [base] = await db.select().from(creatorPresence).where(eq(creatorPresence.slug, slug)).limit(1);

  const [catalogEntry] = base ? [] : await db.select({ slug: presence.slug }).from(presence).where(eq(presence.slug, slug)).limit(1);

  if (catalogEntry) throw new SubmissionError("NOT_CREATOR_PRESENCE", "This presence was not made with the creator and cannot be edited here.");

  const draft = asDraft(definition);
  await assertNoOtherPending(slug, input.userId, definition.id);
  const issues = validateDraft(draft).filter((issue) => issue.step !== SERVER_CHECKED_LATER_STEP);

  if (issues.length) {
    throw new SubmissionError(
      "INVALID_DEFINITION",
      `The presence is not ready: ${issues
        .slice(0, ISSUES_IN_MESSAGE)
        .map((issue) => issue.code)
        .join(", ")}.`
    );
  }

  const files = buildTextFiles(draft);

  return db.transaction(async (tx) => {
    const now = new Date();
    const [existing] = await tx
      .select()
      .from(presenceSubmission)
      .where(and(eq(presenceSubmission.authorId, input.userId), eq(presenceSubmission.draftId, definition.id)))
      .for("update");

    if (existing && !isOneOf(existing.status, EDITABLE_STATUSES)) throw new SubmissionError(
      "SUBMISSION_LOCKED",
      "This submission is under review and cannot be changed now."
    );

    const [previous] = existing
      ? await tx
          .select({ definition: presenceSubmissionRevision.definition })
          .from(presenceSubmissionRevision)
          .where(eq(presenceSubmissionRevision.submissionId, existing.id))
          .orderBy(desc(presenceSubmissionRevision.number))
          .limit(1)
      : [];
    const before = parseCreatorDefinition(previous?.definition ?? base?.definition ?? null);
    const id = existing?.id ?? randomBytes(SUBMISSION_ID_BYTES).toString("hex");
    const revision = (existing?.revision ?? 0) + 1;

    const [row] = existing
      ? await tx
          .update(presenceSubmission)
          .set({
            status: "submitted",
            revision,
            slug,
            translate: input.translate,
            note: null,
            updatedAt: now
          })
          .where(eq(presenceSubmission.id, existing.id))
          .returning()
      : await tx
          .insert(presenceSubmission)
          .values({
            id,
            draftId: definition.id,
            authorId: input.userId,
            kind: base ? "update" : "create",
            slug,
            baseRevision: base?.revision ?? null,
            status: "submitted",
            translate: input.translate
          })
          .returning();

    await tx.insert(presenceSubmissionRevision).values({
      id: randomUUID(),
      submissionId: id,
      number: revision,
      authorId: input.userId,
      definition,
      files,
      changes: diffDefinitions(before, definition)
    });
    await tx.insert(presenceSubmissionEvent).values({
      id: randomUUID(),
      submissionId: id,
      revision,
      type: existing ? "resubmitted" : "submitted",
      status: "submitted",
      actorId: input.userId
    });
    return toSummary(row);
  });
};

export const listOwnSubmissions = async (userId: string, ids: string[]): Promise<SubmissionSummary[]> => {
  if (!ids.length) return [];

  const rows = await getDb()
    .select()
    .from(presenceSubmission)
    .where(and(eq(presenceSubmission.authorId, userId), inArray(presenceSubmission.id, ids)));
  return rows.map(toSummary);
};