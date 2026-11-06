import { foreignKey, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@nowly/database/schema/auth/user";
import { presenceReport } from "@nowly/database/schema/report/presence-report";

export const presenceReportMessage = pgTable(
  "presence_report_messages",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id").notNull(),
    authorId: text("author_id"),
    authorRole: text("author_role").notNull(),
    kind: text("kind").default("message").notNull(),
    visibility: text("visibility").default("public").notNull(),
    body: text("body").default("").notNull(),
    choices: jsonb("choices"),
    answerTo: text("answer_to"),
    statusTo: text("status_to"),
    attachments: jsonb("attachments")
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
    index("presence_report_messages_report_id_created_at_idx").on(table.reportId, table.createdAt),
    foreignKey({
      name: "presence_report_messages_report_id_fkey",
      columns: [table.reportId],
      foreignColumns: [presenceReport.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      name: "presence_report_messages_author_id_fkey",
      columns: [table.authorId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);