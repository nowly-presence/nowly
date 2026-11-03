import { foreignKey, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@nowly/database/schema/auth/user";
import { presenceSubmission } from "@nowly/database/schema/creator/presence-submission";

export const presenceSubmissionReview = pgTable(
  "presence_submission_reviews",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    revision: integer("revision").notNull(),
    reviewerId: text("reviewer_id"),
    verdict: text("verdict").notNull(),
    message: text("message").notNull(),
    comments: jsonb("comments")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("presence_submission_reviews_submission_id_idx").on(table.submissionId),
    foreignKey({
      name: "presence_submission_reviews_submission_id_fkey",
      columns: [table.submissionId],
      foreignColumns: [presenceSubmission.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      name: "presence_submission_reviews_reviewer_id_fkey",
      columns: [table.reviewerId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);