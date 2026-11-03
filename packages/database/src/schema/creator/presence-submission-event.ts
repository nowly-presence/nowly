import { foreignKey, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@nowly/database/schema/auth/user";
import { presenceSubmission } from "@nowly/database/schema/creator/presence-submission";

export const presenceSubmissionEvent = pgTable(
  "presence_submission_events",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    revision: integer("revision").notNull(),
    type: text("type").notNull(),
    status: text("status").notNull(),
    actorId: text("actor_id"),
    note: text("note"),
    details: jsonb("details")
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
    index("presence_submission_events_submission_id_idx").on(table.submissionId),
    foreignKey({
      name: "presence_submission_events_submission_id_fkey",
      columns: [table.submissionId],
      foreignColumns: [presenceSubmission.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      name: "presence_submission_events_actor_id_fkey",
      columns: [table.actorId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);