"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { visibleTabs } from "@/features/shell/lib/account-tabs";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";

export const AccountNav = ({ capabilities }: {
  capabilities: readonly string[];
}) => {
  const t = useTranslations("accountPage");
  const shell = useTranslations("shell");
  const pathname = usePathname();
  return (
    <nav aria-label={shell("nav-label")} className="hidden flex-wrap gap-1 lg:flex">
      {visibleTabs(capabilities).map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-secondary text-foreground" : "text-foreground/60 hover:text-foreground"
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
};