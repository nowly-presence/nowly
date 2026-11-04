import { getDb } from "@/db/client";
import { recordAdminAction, type AuditActor } from "@/features/admin/audit.service";
import type { Transaction } from "@nowly/database/client";
import { creatorPresence, presenceSubmission, presenceSubmissionEvent, presenceSubmissionReview, presenceSubmissionRevision } from "@nowly/database/schema/creator";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { SubmissionError } from "./submission-errors";
import { isOneOf, PUBLISHABLE_STATUSES, verdictTarget, type ReviewVerdict } from "./submission-status";
import { toSummary, type SubmissionSummary } from "./submission.service";

export type FieldComment = {
  field: string;
  page?: string;
  message: string;
};

export type ReviewInput = {
  reviewerId: string;
  submissionId: string;
  revision: number;
  verdict: ReviewVerdict;
  message: string;
  comments: FieldComment[];
};

const lockSubmission = async (tx: Transaction, id: string, revision: number) => {
  const [row] = await tx.select().from(presenceSubmission).where(eq(presenceSubmission.id, id)).for("update");

  if (!row) throw new SubmissionError("SUBMISSION_NOT_FOUND", "Submission not found.");
  if (row.revision !== revision) throw new SubmissionError("STALE_REVISION", "A newer revision was sent, reload before reviewing.");

  return row;
};

export const reviewSubmission = async (input: ReviewInput): Promise<SubmissionSummary> =>
  getDb().transaction(async (tx) => {
    const row = await lockSubmission(tx, input.submissionId, input.revision);

    if (row.authorId === input.reviewerId) throw new SubmissionError("OWN_SUBMISSION", "You cannot review your own submission.");

    const target = verdictTarget(input.verdict, row.status);

    if (!target.allowed) throw new SubmissionError("INVALID_TRANSITION", `A ${input.verdict} review is not possible while the submission is ${row.status}.`);

    const status = target.to ?? row.status;
    const now = new Date();
    const [updated] = await tx
      .update(presenceSubmission)
      .set({
        status,
        updatedAt: now,
        ...(input.verdict === "request_changes" || input.verdict === "reject" ? { note: input.message } : {})
      })
      .where(eq(presenceSubmission.id, row.id))
      .returning();

    await tx.insert(presenceSubmissionReview).values({
      id: randomUUID(),
      submissionId: row.id,
      revision: row.revision,
      reviewerId: input.reviewerId,
      verdict: input.verdict,
      message: input.message,
      comments: input.comments
    });
    await tx.insert(presenceSubmissionEvent).values({
      id: randomUUID(),
      submissionId: row.id,
      revision: row.revision,
      type: `review.${input.verdict}`,
      status,
      actorId: input.reviewerId,
      note: input.message
    });
    await recordAdminAction(
      tx,
      {
        kind: "user",
        userId: input.reviewerId
      },
      {
        action: "submission.review",
        targetType: "submission",
        targetId: row.id,
        details: {
          verdict: input.verdict,
          revision: row.revision,
          from: row.status,
          to: status
        }
      }
    );
    return toSummary(updated);
  });

export const publishSubmission = async (input: {
  adminId: string;
  submissionId: string;
  revision: number;
}): Promise<
  SubmissionSummary & {
    withoutReview: boolean;
  }
> =>
  getDb().transaction(async (tx) => {
    const row = await lockSubmission(tx, input.submissionId, input.revision);

    if (!isOneOf(row.status, PUBLISHABLE_STATUSES)) throw new SubmissionError(
      "INVALID_TRANSITION",
      `The submission cannot be published while it is ${row.status}.`
    );

    const withoutReview = row.status === "submitted";
    const [updated] = await tx
      .update(presenceSubmission)
      .set({
        status: "in_progress",
        updatedAt: new Date()
      })
      .where(eq(presenceSubmission.id, row.id))
      .returning();

    await tx.insert(presenceSubmissionEvent).values({
      id: randomUUID(),
      submissionId: row.id,
      revision: row.revision,
      type: "publish",
      status: "in_progress",
      actorId: input.adminId,
      details: { withoutReview }
    });
    await recordAdminAction(
      tx,
      {
        kind: "user",
        userId: input.adminId
      },
      {
        action: "submission.publish",
        targetType: "submission",
        targetId: row.id,
        details: {
          revision: row.revision,
          withoutReview
        }
      }
    );
    return { ...toSummary(updated), withoutReview };
  });

export const markSubmissionPublished = async (input: { slug: string; commit: string; pr: number; actor: AuditActor }): Promise<SubmissionSummary> =>
  getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(presenceSubmission)
      .where(and(eq(presenceSubmission.slug, input.slug), eq(presenceSubmission.status, "in_progress")))
      .for("update");

    if (!row) throw new SubmissionError("NOT_PUBLISHING", "No submission is being published for this presence.");

    const [revision] = await tx
      .select({ definition: presenceSubmissionRevision.definition })
      .from(presenceSubmissionRevision)
      .where(and(eq(presenceSubmissionRevision.submissionId, row.id), eq(presenceSubmissionRevision.number, row.revision)));

    const [current] = await tx.select({ revision: creatorPresence.revision }).from(creatorPresence).where(eq(creatorPresence.slug, row.slug)).for("update");

    const now = new Date();
    const values = {
      definition: revision.definition,
      revision: (current?.revision ?? 0) + 1,
      submissionId: row.id,
      updatedById: row.authorId,
      publishedAt: now,
      updatedAt: now
    };

    await tx
      .insert(creatorPresence)
      .values({
        slug: row.slug,
        ...values
      })
      .onConflictDoUpdate({
        target: creatorPresence.slug,
        set: values
      });

    const [updated] = await tx
      .update(presenceSubmission)
      .set({
        status: "published",
        publishedAt: now,
        prNumber: input.pr,
        updatedAt: now
      })
      .where(eq(presenceSubmission.id, row.id))
      .returning();

    await tx.insert(presenceSubmissionEvent).values({
      id: randomUUID(),
      submissionId: row.id,
      revision: row.revision,
      type: "published",
      status: "published",
      details: {
        commit: input.commit,
        pr: input.pr
      }
    });
    await recordAdminAction(tx, input.actor, {
      action: "submission.published",
      targetType: "submission",
      targetId: row.id,
      details: {
        slug: row.slug,
        commit: input.commit,
        pr: input.pr
      }
    });
    return toSummary(updated);
  });

export const PULL_REQUEST_CLOSED_NOTE = "The pull request was closed without being merged. Update the presence and send it again.";

export const markPullRequestClosed = async (input: { slug: string; pr: number }): Promise<SubmissionSummary> =>
  getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(presenceSubmission)
      .where(and(eq(presenceSubmission.slug, input.slug), eq(presenceSubmission.prNumber, input.pr), eq(presenceSubmission.status, "in_progress")))
      .for("update");

    if (!row) throw new SubmissionError("NOT_PUBLISHING", "No submission is waiting on this pull request.");

    const [updated] = await tx
      .update(presenceSubmission)
      .set({
        status: "changes_requested",
        note: PULL_REQUEST_CLOSED_NOTE,
        prClaimedAt: null,
        prError: null,
        updatedAt: new Date()
      })
      .where(eq(presenceSubmission.id, row.id))
      .returning();

    await tx.insert(presenceSubmissionEvent).values({
      id: randomUUID(),
      submissionId: row.id,
      revision: row.revision,
      type: "pr.closed",
      status: "changes_requested",
      actorId: null,
      details: { pr: input.pr }
    });
    return toSummary(updated);
  });
