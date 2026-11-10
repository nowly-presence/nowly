"use client";

import { useSessionUser } from "@/features/account/components/session-provider";
import { signOutAccount } from "@/features/account/lib/account-api";
import { BrandLockup } from "@nowly/ui/brand-lockup";
import { Link, usePathname } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from "@nowly/ui";
import { RiLogoutBoxRLine } from "@nowly/ui/icons";
import { LocaleSelector } from "@nowly/ui/locale-selector";
import { cn } from "@nowly/ui/utils";
import { useTranslations } from "next-intl";
import type { ComponentType, PropsWithChildren } from "react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
  active: (pathname: string) => boolean;
  count?: number | null;
};

export type SidebarLink = {
  href: string;
  label: string;
  icon: ComponentType<{
    className?: string;
  }>;
};

export const SidebarShell = ({ tag, navLabel, items, links, children }: PropsWithChildren<{
  tag: string;
  navLabel: string;
  items: readonly SidebarItem[];
  links: readonly SidebarLink[];
}>) => {
  const t = useTranslations("staff");
  const user = useSessionUser();
  const pathname = usePathname();

  const onSignOut = (): void => {
    signOutAccount().finally(() => window.location.assign("/sign-in"));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b border-border p-3 lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:border-r lg:border-b-0 lg:p-4">
        <div className="flex items-center justify-between gap-2 px-1">
          <BrandLockup width={104} height={42} className="h-9 w-auto" />
          <Badge variant="secondary">{tag}</Badge>
        </div>
        <nav aria-label={navLabel} className="flex gap-1 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-visible">
          {items.map((item) => {
            const active = item.active(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-foreground/8 text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {item.count ? <Badge variant="secondary">{item.count}</Badge> : null}
              </Link>
            );
          })}
        </nav>
        <div className="hidden flex-col gap-3 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
          <LocaleSelector />
          <div className="flex items-center gap-2.5 rounded-[10px] bg-foreground/4 p-2.5 ring-1 ring-foreground/10">
            <Avatar>
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{t(`role-${user.role}`)}</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={t("sign-out")} onClick={onSignOut}>
              <RiLogoutBoxRLine className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-300">{children}</div>
      </main>
    </div>
  );
};