import { foreignKey, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "@nowly/database/schema/auth/user";

export const adminAuditEvent = pgTable(
  "admin_audit_events",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    actorKind: text("actor_kind").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    details: jsonb("details")
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull()
  },
  (table) => [
    index("admin_audit_events_created_at_idx").on(table.createdAt),
    index("admin_audit_events_actor_id_idx").on(table.actorId),
    foreignKey({
      name: "admin_audit_events_actor_id_fkey",
      columns: [table.actorId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("set null")
  ]
);