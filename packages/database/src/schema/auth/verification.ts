import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const verification = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    precision: 6
  }).notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    precision: 6
  }).defaultNow(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    precision: 6
  })
    .defaultNow()
    .$onUpdate(() => new Date())
});