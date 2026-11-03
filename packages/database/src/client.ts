import * as schema from "@nowly/database/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";

const CONNECTION_TIMEOUT_MS = 10_000;

export { schema };

export type Schema = typeof schema;

export type Database = PgDatabase<PgQueryResultHKT, Schema>;

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type Executor = Database | Transaction;

export const createDatabase = (connectionString: string): {
  db: Database;
  pool: Pool;
} => {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS
  });
  return {
    db: drizzle({
      client: pool,
      schema
    }),
    pool
  };
};