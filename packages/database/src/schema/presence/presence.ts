import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const presence = pgTable("presences", {
  slug: text("slug").primaryKey(),
  metadata: jsonb("metadata")
    .default(sql`'{}'::jsonb`)
    .notNull(),
  version: text("version"),
  archived: boolean("archived").default(false).notNull(),
  addedAt: timestamp("added_at", {
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
});