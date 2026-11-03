import { foreignKey, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const account = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
      precision: 6
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
      precision: 6
    }),
    scope: text("scope"),
    password: text("password"),
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
    foreignKey({
      name: "accounts_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);