import { foreignKey, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@nowly/database/schema/auth/user";
import { presenceSubmission } from "@nowly/database/schema/creator/presence-submission";

export const presenceSubmissionRevision = pgTable(
  "presence_submission_revisions",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    number: integer("number").notNull(),
    authorId: text("author_id"),
    definition: jsonb("definition").notNull(),
    files: jsonb("files")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    changes: jsonb("changes")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    assets: jsonb("assets")
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    uniqueIndex("presence_submission_revisions_submission_id_number_key").on(table.submissionId, table.number),
    foreignKey({
      name: "presence_submission_revisions_submission_id_fkey",
      columns: [table.submissionId],
      foreignColumns: [presenceSubmission.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      name: "presence_submission_revisions_author_id_fkey",
      columns: [table.authorId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);