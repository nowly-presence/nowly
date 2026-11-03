import { foreignKey, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "@nowly/database/schema/auth/user";

export const extensionToken = pgTable(
  "extension_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    deviceId: text("device_id"),
    tokenHash: text("token_hash").notNull(),
    scopes: text("scopes").array(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      precision: 6
    })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      precision: 6
    }).notNull(),
    revokedAt: timestamp("revoked_at", {
      withTimezone: true,
      precision: 6
    }),
    lastUsedAt: timestamp("last_used_at", {
      withTimezone: true,
      precision: 6
    })
  },
  (table) => [
    uniqueIndex("extension_tokens_token_hash_key").on(table.tokenHash),
    index("extension_tokens_user_id_idx").on(table.userId),
    index("extension_tokens_device_id_idx").on(table.deviceId),
    foreignKey({
      name: "extension_tokens_user_id_fkey",
      columns: [table.userId],
      foreignColumns: [user.id]
    })
      .onUpdate("cascade")
      .onDelete("cascade")
  ]
);