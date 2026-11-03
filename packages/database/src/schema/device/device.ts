import { foreignKey, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const device = pgTable(
  "devices",
  {
    deviceId: text("device_id").primaryKey(),
    userId: text("user_id"),
    extensionVersion: text("extension_version"),
    nativeVersion: text("native_version"),
    browser: text("browser"),
    os: text("os"),
    locale: text("locale"),
    firstSeenAt: timestamp("first_seen_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("devices_user_id_idx").on(table.userId),
    foreignKey({
      name: "devices_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);