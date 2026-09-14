import { MobileSidebarToggle } from "@/components/docs/mobile-sidebar-toggle";
import { SearchProvider } from "@/components/docs/search-provider";
import { AppSidebar } from "@/components/docs/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar-context";
import { getNavigationItems } from "@/lib/docs/content";
import { getLocale } from "next-intl/server";
import type { PropsWithChildren, ReactElement } from "react";

const Layout = async ({ children }: PropsWithChildren): Promise<ReactElement> => {
  const locale = await getLocale();
  const navItems = getNavigationItems(locale);

  return (
    <SidebarProvider>
      <SearchProvider>
        <div className="flex mx-auto max-w-screen-2xl w-full gap-8 px-6 pt-24 pb-16 flex-1">
          <AppSidebar items={navItems} />

          <main className="flex-1 min-w-0 max-w-3xl">
            <MobileSidebarToggle />
            {children}
          </main>
        </div>
      </SearchProvider>
    </SidebarProvider>
  );
};

export default Layout;