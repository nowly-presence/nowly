import { ModerationTabs } from "@/features/shell/components/moderation-tabs";
import { visibleModerationTabs } from "@/features/shell/lib/account-tabs";
import { redirect } from "@/i18n/navigation";
import { readServerSession } from "@/lib/server-session";
import { getLocale } from "next-intl/server";
import type { PropsWithChildren } from "react";

const ModerationLayout = async ({ children }: PropsWithChildren) => {
  const [user, locale] = await Promise.all([readServerSession(), getLocale()]);
  const capabilities = user?.capabilities ?? [];

  if (visibleModerationTabs(capabilities).length === 0) return redirect({
    href: "/profile",
    locale
  });

  return (
    <>
      <ModerationTabs capabilities={capabilities} />
      {children}
    </>
  );
};

export default ModerationLayout;
