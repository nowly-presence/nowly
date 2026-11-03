import { SessionProvider } from "@/features/account/components/session-provider";
import { AccountShell } from "@/features/shell/components/account-shell";
import { redirect } from "@/i18n/navigation";
import { readServerSession } from "@/lib/server-session";
import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

const SecureLayout = async ({ children }: PropsWithChildren) => {
  const [user, locale] = await Promise.all([
    readServerSession(),
    getLocale()
  ]);

  if (!user) return redirect({
    href: "/sign-in",
    locale
  });

  return (
    <SessionProvider user={user}>
      <AccountShell capabilities={user.capabilities}>{children}</AccountShell>
    </SessionProvider>
  );
};

export default SecureLayout;