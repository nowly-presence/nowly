"use client";

import { useSidebar } from "@/components/ui/sidebar-context";
import type { DocNavigationItem } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

type AppSidebarProps = {
  items: DocNavigationItem[];
};

export const AppSidebar: FC<AppSidebarProps> = ({ items }) => {
  const t = useTranslations("docs");
  const { open: mobileOpen, setOpen: setMobileOpen } = useSidebar();
  const pathname = usePathname();

  const sidebarContent = (
    <nav>
      <div className="space-y-7">
        {items.map((item) => (
          <div key={item.slug}>
            <p className="mb-2.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {item.title}
            </p>

            <ul className="space-y-0.5">
              {item.children.map((child) => {
                const isChildActive = pathname === `/docs/${child.path}`;
                const href = `/docs/${child.path}`;

                return (
                  <li key={child.slug}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-lg px-3 py-1.5 text-sm transition-colors", {
                          "bg-accent/10 text-accent font-medium": isChildActive,
                          "text-muted-foreground hover:text-foreground hover:bg-card-hover": !isChildActive,
                        }
                      )}
                    >
                      {child.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24 w-56 max-h-[calc(100vh-8rem)] overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-foreground">{t("documentation")}</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconX size={20} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};