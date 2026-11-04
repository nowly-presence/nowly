"use client";

import { useSessionUser } from "@/features/account/components/session-provider";
import { SidebarShell, type SidebarItem } from "@/features/shell/components/sidebar-shell";
import { ACCOUNT_TABS } from "@/features/shell/lib/account-tabs";
import { hasStaffAccess } from "@/features/staff/lib/staff-nav";
import { RiComputerLine, RiGlobalLine, RiMagicLine, RiShapesLine, RiShieldUserLine, RiUserLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import type { ComponentType, PropsWithChildren } from "react";

const TAB_ICONS: Record<
  (typeof ACCOUNT_TABS)[number]["key"],
  ComponentType<{
    className?: string;
  }>
> = {
  "tab-profile": RiUserLine,
  "tab-devices": RiComputerLine,
  "tab-presences": RiShapesLine,
  "tab-creations": RiMagicLine,
  "tab-public": RiGlobalLine
};

export const AccountShell = ({ children }: PropsWithChildren) => {
  const t = useTranslations("accountPage");
  const shell = useTranslations("shell");
  const user = useSessionUser();

  const items: SidebarItem[] = ACCOUNT_TABS.map((tab) => ({
    href: tab.href,
    label: t(tab.key),
    icon: TAB_ICONS[tab.key],
    active: (pathname) => pathname.startsWith(tab.href)
  }));

  return (
    <SidebarShell
      tag={shell("account-badge")}
      navLabel={shell("account-nav-label")}
      items={items}
      links={
        hasStaffAccess(user.capabilities)
          ? [
              {
                href: "/moderation",
                label: shell("staff-link"),
                icon: RiShieldUserLine
              }
            ]
          : []
      }
    >
      {children}
    </SidebarShell>
  );
};