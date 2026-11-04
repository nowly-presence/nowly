import { SessionProvider } from "@/features/account/components/session-provider";
import { StaffShell } from "@/features/staff/components/staff-shell";
import { hasStaffAccess } from "@/features/staff/lib/staff-nav";
import { redirect } from "@/i18n/navigation";
import { readServerSession } from "@/lib/server-session";
import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

const StaffLayout = async ({ children }: PropsWithChildren) => {
  const [user, locale] = await Promise.all([readServerSession(), getLocale()]);

  if (!user) return redirect({
    href: "/sign-in",
    locale
  });

  if (!hasStaffAccess(user.capabilities)) return redirect({
    href: "/profile",
    locale
  });

  return (
    <SessionProvider user={user}>
      <StaffShell>{children}</StaffShell>
    </SessionProvider>
  );
};

export default StaffLayout;
