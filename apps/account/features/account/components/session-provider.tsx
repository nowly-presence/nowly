"use client";

import type { AccountUser } from "@/features/account/lib/account-api";
import { createContext, useContext, type PropsWithChildren } from "react";

const SessionContext = createContext<AccountUser | null>(null);

export const SessionProvider = ({ user, children }: PropsWithChildren<{
  user: AccountUser;
}>) => <SessionContext value={user}>{children}</SessionContext>;

export const useSessionUser = (): AccountUser => {
  const user = useContext(SessionContext);

  if (!user) throw new Error("SESSION_MISSING");

  return user;
};