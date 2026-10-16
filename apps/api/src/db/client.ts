import { serverEnv } from "@nowly/env/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

let prisma: PrismaClient | null = null;

export const hasDatabase = (): boolean => Boolean(serverEnv.DATABASE_URL);

export const getPrisma = (): PrismaClient => {
  if (!serverEnv.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for PostgreSQL-backed data operations",
    );
  }

  if (!prisma) {
    const adapter = new PrismaPg({ connectionString: serverEnv.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
};