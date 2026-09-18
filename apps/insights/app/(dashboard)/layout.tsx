import { AppSidebar } from "@/components/app-sidebar";
import { DashboardShell } from "@/components/dashboard-shell";
import { API_TARGET_COOKIE, apiBaseUrlFor, resolveApiTarget } from "@/lib/api-target";
import { getSession } from "@/lib/session";
import { SidebarProvider } from "@nowly/ui";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

type InsightsViewSummary = { id: string; name: string };

const Layout = async ({ children }: PropsWithChildren) => {
  const cookieStore = await cookies();
  const cookieHeader = (await headers()).get("cookie") ?? undefined;
  const target = resolveApiTarget(cookieStore.get(API_TARGET_COOKIE)?.value);

  const session = await getSession(cookieHeader, target);
  if (!session || session.user.role !== "admin") redirect("/login");

  let views: InsightsViewSummary[] = [];
  try {
    const res = await fetch(`${apiBaseUrlFor(target)}/insights/views`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store",
    });
    if (res.ok) ({ views } = await res.json());
  } catch {
    views = [];
  }

  return (
    <SidebarProvider>
      <AppSidebar views={views} user={session.user} />
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
};

export default Layout;
