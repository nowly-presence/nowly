import { foreignKey, index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const presenceLike = pgTable(
  "presence_likes",
  {
    slug: text("slug").notNull(),
    deviceId: text("device_id").notNull(),
    userId: text("user_id"),
    likedAt: timestamp("liked_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    primaryKey({
      name: "presence_likes_pkey",
      columns: [table.slug, table.deviceId]
    }),
    index("presence_likes_slug_idx").on(table.slug),
    index("presence_likes_user_id_idx").on(table.userId),
    foreignKey({
      name: "presence_likes_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);