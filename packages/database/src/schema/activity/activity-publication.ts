import { boolean, foreignKey, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const activityPublication = pgTable(
  "activity_publications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    localKey: text("local_key").notNull(),
    activity: jsonb("activity").notNull(),
    revision: integer("revision").default(1).notNull(),
    published: boolean("published").default(true).notNull(),
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
    uniqueIndex("activity_publications_user_id_local_key_key").on(table.userId, table.localKey),
    foreignKey({
      name: "activity_publications_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);