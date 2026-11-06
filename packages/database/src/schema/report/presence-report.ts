import { boolean, foreignKey, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@nowly/database/schema/auth/user";

export const presenceReport = pgTable(
  "presence_reports",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    reporterId: text("reporter_id"),
    deviceId: text("device_id"),
    secretHash: text("secret_hash").notNull(),
    anonymous: boolean("anonymous").default(true).notNull(),
    reporterLabel: text("reporter_label"),
    reporterSource: text("reporter_source").default("none").notNull(),
    status: text("status").default("new").notNull(),
    assigneeId: text("assignee_id"),
    context: jsonb("context")
      .default(sql`'{}'::jsonb`)
      .notNull(),
    notify: boolean("notify").default(false).notNull(),
    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull(),
    reporterReadAt: timestamp("reporter_read_at", {
      withTimezone: true,
      precision: 6
    }),
    staffReadAt: timestamp("staff_read_at", {
      withTimezone: true,
      precision: 6
    }),
    autoCloseAt: timestamp("auto_close_at", {
      withTimezone: true,
      precision: 6
    }),
    resolvedAt: timestamp("resolved_at", {
      withTimezone: true,
      precision: 6
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("presence_reports_device_id_last_message_at_idx").on(table.deviceId, table.lastMessageAt),
    index("presence_reports_reporter_id_last_message_at_idx").on(table.reporterId, table.lastMessageAt),
    index("presence_reports_status_last_message_at_idx").on(table.status, table.lastMessageAt),
    index("presence_reports_slug_idx").on(table.slug),
    foreignKey({
      name: "presence_reports_reporter_id_fkey",
      columns: [table.reporterId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      name: "presence_reports_assignee_id_fkey",
      columns: [table.assigneeId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);