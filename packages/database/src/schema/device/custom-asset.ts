import { foreignKey, index, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { device } from "@nowly/database/schema/device/device";

export const customAsset = pgTable(
  "custom_assets",
  {
    deviceId: text("device_id").notNull(),
    sha256: text("sha256").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull(),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    primaryKey({
      name: "custom_assets_pkey",
      columns: [table.deviceId, table.sha256]
    }),
    index("custom_assets_last_used_at_idx").on(table.lastUsedAt),
    foreignKey({
      name: "custom_assets_device_id_fkey",
      columns: [table.deviceId],
      foreignColumns: [device.deviceId]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);