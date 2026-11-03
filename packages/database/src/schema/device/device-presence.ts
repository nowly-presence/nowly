import { boolean, foreignKey, index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { device } from "@nowly/database/schema/device/device";

export const devicePresence = pgTable(
  "device_presences",
  {
    deviceId: text("device_id").notNull(),
    slug: text("slug").notNull(),
    installedVersion: text("installed_version"),
    installed: boolean("installed").default(true).notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    installedAt: timestamp("installed_at", {
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
      .notNull(),
    uninstalledAt: timestamp("uninstalled_at", {
      withTimezone: true,
      precision: 6
    })
  },
  (table) => [
    primaryKey({
      name: "device_presences_pkey",
      columns: [table.deviceId, table.slug]
    }),
    index("device_presences_slug_idx").on(table.slug),
    foreignKey({
      name: "device_presences_device_id_fkey",
      columns: [table.deviceId],
      foreignColumns: [device.deviceId]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);