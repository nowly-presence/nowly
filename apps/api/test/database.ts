import { PGlite } from "@electric-sql/pglite";
import { clearDatabaseOverride, overrideDatabase } from "@/db/client";
import { schema } from "@nowly/database/client";
import { MIGRATIONS_FOLDER } from "@nowly/database/migrate";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import { createExtensionToken } from "@/features/account/extension-token.service";
import { user } from "@nowly/database/schema/auth";
import type { ExtensionTokenScope } from "@nowly/shared";

export const createTestDatabase = async () => {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  overrideDatabase(db);

  const tables = await client.query<{
    tablename: string;
  }>("select tablename from pg_tables where schemaname = 'public'");

  return {
    db,
    reset: async () => {
      await db.execute(sql.raw(`truncate ${tables.rows.map((row) => `"${row.tablename}"`).join(", ")} restart identity cascade`));
    },
    close: async () => {
      clearDatabaseOverride();
      await client.close();
    }
  };
};

export type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;

export const seedUser = async (db: TestDatabase["db"], id = "user-1") => {
  await db.insert(user).values({
    id,
    name: id,
    email: `${id}@example.com`
  });
  return id;
};

export const seedExtensionToken = async (input: { userId: string; deviceId?: string; scopes: ExtensionTokenScope[] }) =>
  (await createExtensionToken(input)).token;