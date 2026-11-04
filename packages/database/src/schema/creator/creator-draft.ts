import { bigint, boolean, foreignKey, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const creatorDraft = pgTable(
  "creator_drafts",
  {
    userId: text("user_id").notNull(),
    draftId: text("draft_id").notNull(),
    value: jsonb("value"),
    draftUpdatedAt: bigint("draft_updated_at", { mode: "number" }).notNull(),
    deleted: boolean("deleted").default(false).notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    primaryKey({
      name: "creator_drafts_pkey",
      columns: [table.userId, table.draftId]
    }),
    foreignKey({
      name: "creator_drafts_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);
