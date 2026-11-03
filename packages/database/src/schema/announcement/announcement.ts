import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const announcement = pgTable(
  "Announcement",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    translations: jsonb("translations").notNull(),
    kind: text("kind").notNull(),
    severity: integer("severity"),
    pinned: boolean("pinned").default(false).notNull(),
    startsAt: timestamp("startsAt", { precision: 3 }),
    endsAt: timestamp("endsAt", { precision: 3 }),
    expiresAt: timestamp("expiresAt", { precision: 3 }),
    publishedAt: timestamp("publishedAt", { precision: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { precision: 3 })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date())
  },
  (table) => [
    index("Announcement_publishedAt_idx").on(table.publishedAt),
    check("Announcement_kind_check", sql`${table.kind} IN ('normal', 'warning', 'maintenance')`),
    check(
      "Announcement_severity_check",
      sql`(${table.kind} = 'warning' AND ${table.severity} IS NOT NULL AND ${table.severity} BETWEEN 1 AND 3) OR (${table.kind} <> 'warning' AND ${table.severity} IS NULL)`
    )
  ]
);