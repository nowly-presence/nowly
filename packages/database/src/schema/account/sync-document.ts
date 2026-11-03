import { foreignKey, index, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const syncDocument = pgTable(
  "sync_documents",
  {
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    version: integer("version").notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull(),
    updatedByDeviceId: text("updated_by_device_id")
  },
  (table) => [
    primaryKey({
      name: "sync_documents_pkey",
      columns: [table.userId, table.key]
    }),
    index("sync_documents_user_id_updated_at_idx").on(table.userId, table.updatedAt),
    foreignKey({
      name: "sync_documents_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);