import { getDb } from "@/db/client";
import { account } from "@nowly/database/schema/auth";
import { and, eq } from "drizzle-orm";

export const linkedDiscordId = async (userId: string): Promise<string | null> => {
  const [linked] = await getDb()
    .select({ accountId: account.accountId })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "discord")))
    .limit(1);
  return linked?.accountId ?? null;
};