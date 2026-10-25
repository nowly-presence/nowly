import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const tables = [
  "device_presences",
  "presence_active_devices",
  "devices",
  "donation_events",
  "supporter_devices",
  "supporter_passes",
  "ratings",
  "comments"
] as const;

async function main() {
  console.log("Clearing dev data...\n");

  for (const table of tables) {
    const result = await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    console.log(`  ${table}: ${result} rows deleted`);
  }

  console.log("\nDone. Presences and presence_versions are untouched.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());