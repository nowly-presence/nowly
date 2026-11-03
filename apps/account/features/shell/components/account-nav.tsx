"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";

const ITEMS = [
  {
    href: "/profile",
    key: "tab-profile",
    staff: false
  },
  {
    href: "/devices",
    key: "tab-devices",
    staff: false
  },
  {
    href: "/presences",
    key: "tab-presences",
    staff: false
  },
  {
    href: "/creations",
    key: "tab-creations",
    staff: false
  },
  {
    href: "/public-page",
    key: "tab-public",
    staff: false
  },
  {
    href: "/review",
    key: "tab-review",
    staff: true
  }
] as const;

export const AccountNav = ({ staff }: {
  staff: boolean;
}) => {
  const t = useTranslations("accountPage");
  const shell = useTranslations("shell");
  const pathname = usePathname();
  return (
    <nav aria-label={shell("nav-label")} className="flex flex-wrap gap-1">
      {ITEMS.filter((item) => staff || !item.staff).map((item) => {
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