import { boolean, foreignKey, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const presenceSubmission = pgTable(
  "presence_submissions",
  {
    id: text("id").primaryKey(),
    draftId: text("draft_id").notNull(),
    authorId: text("author_id").notNull(),
    kind: text("kind").notNull(),
    slug: text("slug").notNull(),
    baseRevision: integer("base_revision"),
    status: text("status").notNull(),
    translate: boolean("translate").default(false).notNull(),
    revision: integer("revision").default(1).notNull(),
    note: text("note"),
    prNumber: integer("pr_number"),
    prUrl: text("pr_url"),
    publishedAt: timestamp("published_at", {
      withTimezone: true,
      precision: 6
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    uniqueIndex("presence_submissions_author_id_draft_id_key").on(table.authorId, table.draftId),
    index("presence_submissions_status_idx").on(table.status),
    index("presence_submissions_slug_idx").on(table.slug),
    foreignKey({
      name: "presence_submissions_author_id_fkey",
      columns: [table.authorId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);