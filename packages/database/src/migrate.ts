import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

export const MIGRATIONS_FOLDER = new URL("../migrations", import.meta.url).pathname;
const BASELINE_TABLE = "public.users";
const HISTORY_TABLE = "drizzle.__drizzle_migrations";

export const migrateDatabase = async (connectionString: string): Promise<void> => {
  const pool = new Pool({ connectionString });

  try {
    const state = await pool.query<{
      baseline: string | null;
      history: string | null;
    }>("select to_regclass($1) as baseline, to_regclass($2) as history", [BASELINE_TABLE, HISTORY_TABLE]);

    const { baseline, history } = state.rows[0];

    if (baseline && !history) {
      const [first] = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
      await pool.query("create schema if not exists drizzle");
      await pool.query(`create table ${HISTORY_TABLE} (id serial primary key, hash text not null, created_at bigint)`);
      await pool.query(`insert into ${HISTORY_TABLE} (hash, created_at) values ($1, $2)`, [first.hash, first.folderMillis]);
    }

    await migrate(drizzle({ client: pool }), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
};