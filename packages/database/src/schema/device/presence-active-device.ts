import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const presenceActiveDevice = pgTable(
  "presence_active_devices",
  {
    slug: text("slug").notNull(),
    deviceId: text("device_id").notNull(),
    lastSeenAt: timestamp("last_seen_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    primaryKey({
      name: "presence_active_devices_pkey",
      columns: [table.slug, table.deviceId]
    }),
    index("presence_active_devices_device_id_idx").on(table.deviceId)
  ]
);