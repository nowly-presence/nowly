import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: text("role").default("user").notNull(),
    discordId: text("discord_id"),
    createdAt: timestamp("created_at", {
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
      .$onUpdate(() => new Date())
  },
  (table) => [
    uniqueIndex("users_email_key").on(table.email),
    uniqueIndex("users_discord_id_key").on(table.discordId)
  ]
);