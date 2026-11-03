import { foreignKey, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const session = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    userId: text("user_id").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      precision: 6
    }).notNull(),
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
      .$onUpdate(() => new Date())
  },
  (table) => [
    uniqueIndex("sessions_token_key").on(table.token),
    foreignKey({
      name: "sessions_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);