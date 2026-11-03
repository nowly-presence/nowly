import type { AccountUser } from "@/features/account/lib/account-api";
import { apiBaseUrl } from "@/lib/api-base";
import { cookies } from "next/headers";

export const readServerSession = async (): Promise<AccountUser | null> => {
  const jar = await cookies();

  const cookie = jar.toString();

  if (!cookie) return null;

  try {
    const response = await fetch(`${apiBaseUrl()}/me`, {
      headers: { cookie },
      cache: "no-store"
    });

    if (!response.ok) return null;

    return (await response.json()) as AccountUser;
  } catch {
    return null;
  }
};