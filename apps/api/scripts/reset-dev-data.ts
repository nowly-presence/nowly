import "dotenv/config";
import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const tables = ["device_presences", "presence_active_devices", "devices"] as const;

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  console.log("Clearing dev data...\n");

  for (const table of tables) {
    const result = await pool.query(`DELETE FROM "${table}"`);
    console.log(`  ${table}: ${result.rowCount ?? 0} rows deleted`);
  }

  console.log("\nDone. Presences and presence_versions are untouched.");
} finally {
  await pool.end();
}