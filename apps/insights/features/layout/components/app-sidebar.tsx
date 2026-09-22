"use client";

import { ApiTargetSwitcher } from "@/features/api-target/components/api-target-switcher";
import { DevTools } from "@/features/layout/components/dev-tools";
import { DEFAULT_VIEW_LABELS, DEFAULT_VIEW_SLUGS } from "@/features/views/lib/default-views";
import type { Session } from "@/lib/session";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@nowly/ui";
import { RiAddLine, RiMailLine } from "@nowly/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

type InsightsViewSummary = { id: string; name: string };

export const AppSidebar = ({ views, user }: { views: InsightsViewSummary[]; user: NonNullable<Session>["user"] }) => {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <span className="px-2 py-1 text-sm font-semibold text-foreground">Nowly Insights</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/campaigns" />} isActive={pathname === "/campaigns"}>
                <RiMailLine />
                <span className="truncate">Campaigns</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Default views</SidebarGroupLabel>
          <SidebarMenu>
            {DEFAULT_VIEW_SLUGS.map((slug) => (
              <SidebarMenuItem key={slug}>
                <SidebarMenuButton
                  render={<Link href={`/views/${slug}`} />}
                  isActive={pathname === `/views/${slug}`}
                >
                  <span className="truncate">{DEFAULT_VIEW_LABELS[slug]}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>My views</SidebarGroupLabel>
          <SidebarMenu>
            {views.map((view) => (
              <SidebarMenuItem key={view.id}>
                <SidebarMenuButton
                  render={<Link href={`/views/custom/${view.id}`} />}
                  isActive={pathname === `/views/custom/${view.id}`}
                >
                  <span className="truncate">{view.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/views/new" />}>
                <RiAddLine />
                New view
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3">
        <DevTools />
        <ApiTargetSwitcher />
        <div className="flex items-center gap-2 px-2 py-1">
          {user.image ? (
            <img src={user.image} alt="" className="size-6 rounded-full" />
          ) : null}
          <span className="truncate text-sm text-muted-foreground">{user.name}</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
