import { createDatabase, type Database } from "@nowly/database/client";
import { serverEnv } from "@nowly/env/server";

type DatabaseOverride = {
  db: Database | null;
};

let database: Database | null = null;
let override: DatabaseOverride | null = null;

export const hasDatabase = (): boolean => (override ? override.db !== null : Boolean(serverEnv.DATABASE_URL));

export const getDb = (): Database => {
  if (override) {
    if (!override.db) throw new Error("DATABASE_URL is required for PostgreSQL-backed data operations");

    return override.db;
  }

  if (!serverEnv.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for PostgreSQL-backed data operations");
  }

  database ??= createDatabase(serverEnv.DATABASE_URL).db;
  return database;
};

export const overrideDatabase = (db: Database | null): void => {
  override = { db };
};

export const clearDatabaseOverride = (): void => {
  override = null;
};