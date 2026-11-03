import "dotenv/config";
import { migrateDatabase } from "@nowly/database/migrate";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is required to migrate the database");

await migrateDatabase(connectionString);