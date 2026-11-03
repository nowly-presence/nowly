import { foreignKey, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const creatorPresence = pgTable(
  "creator_presences",
  {
    slug: text("slug").primaryKey(),
    definition: jsonb("definition").notNull(),
    revision: integer("revision").default(1).notNull(),
    submissionId: text("submission_id"),
    updatedById: text("updated_by_id"),
    publishedAt: timestamp("published_at", {
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
    foreignKey({
      name: "creator_presences_updated_by_id_fkey",
      columns: [table.updatedById],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);