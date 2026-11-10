"use client";

import { useSessionUser } from "@/features/account/components/session-provider";
import { fetchReviewQueue } from "@/features/account/lib/submission-api";
import { SidebarShell, type SidebarItem } from "@/features/shell/components/sidebar-shell";
import { isActiveStaffItem, visibleStaffNav, type StaffNavItem } from "@/features/staff/lib/staff-nav";
import { RiArrowLeftLine, RiBellLine, RiDashboardLine, RiGroupLine, RiHistoryLine, RiInboxLine, RiShapesLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ComponentType, type PropsWithChildren } from "react";

const NAV_ICONS: Record<
  StaffNavItem["key"],
  ComponentType<{
    className?: string;
  }>
> = {
  overview: RiDashboardLine,
  review: RiInboxLine,
  presences: RiShapesLine,
  users: RiGroupLine,
  announcements: RiBellLine,
  audit: RiHistoryLine
};

export const StaffShell = ({ children }: PropsWithChildren) => {
  const t = useTranslations("staff");
  const user = useSessionUser();
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    if (!user.capabilities.includes("review")) return;

    fetchReviewQueue("pending")
      .then((queue) => setPending(queue.counts.pending))
      .catch(() => setPending(null));
  }, [user.capabilities]);

  const items: SidebarItem[] = visibleStaffNav(user.capabilities).map((item) => ({
    href: item.href,
    label: t(`nav-${item.key}`),
    icon: NAV_ICONS[item.key],
    active: (pathname) => isActiveStaffItem(pathname, item.href),
    count: item.key === "review" ? pending : null
  }));

  return (
    <SidebarShell
      tag={t("badge")}
      navLabel={t("nav-label")}
      items={items}
      links={[
        {
          href: "/profile",
          label: t("back-to-account"),
          icon: RiArrowLeftLine
        }
      ]}
    >
      {children}
    </SidebarShell>
  );
};