import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const statusSample = pgTable(
  "status_samples",
  {
    id: serial("id").primaryKey(),
    serviceId: text("service_id").notNull(),
    checkedAt: timestamp("checked_at", {
      withTimezone: true,
      precision: 6
    }).notNull(),
    status: text("status").notNull(),
    responseMs: integer("response_ms"),
    httpStatus: integer("http_status"),
    error: text("error")
  },
  (table) => [index("status_samples_service_id_checked_at_id_idx").on(table.serviceId, table.checkedAt, table.id)]
);