import { boolean, foreignKey, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const publicProfile = pgTable(
  "public_profiles",
  {
    userId: text("user_id").primaryKey(),
    handle: text("handle").notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    bio: text("bio"),
    showCreated: boolean("show_created").default(true).notNull(),
    showLiked: boolean("show_liked").default(true).notNull(),
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
    unique("public_profiles_handle_key").on(table.handle),
    foreignKey({
      name: "public_profiles_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);