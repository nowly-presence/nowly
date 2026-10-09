"use client";

import { ExtensionStoreButton } from "@/components/extension-store-button";
import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { NavbarLinks } from "@/features/layout/components/navbar-links";
import { buttonVariants } from "@nowly/ui/button-variants";
import { cn } from "@nowly/ui/utils";
import { RiMenuLine } from "@remixicon/react";
import { lazy, Suspense, useState } from "react";

const MobileNav = lazy(() => import("@/features/layout/components/mobile-nav").then(({ MobileNav: Component }) => ({ default: Component })));


import { docsHref } from "@/features/seo/lib/seo";
import { Link, usePathname } from "@/i18n/navigation";
import { CANARY_ACCENT, CANARY_INK } from "@/lib/brand";
import { useTranslations } from "next-intl";

export const Navbar = () => {
  const t = useTranslations("navbar");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const canary = pathname === "/canary";
  const storeButtonProps = canary
    ? { className: "border-transparent hover:brightness-110", style: { backgroundColor: CANARY_ACCENT, color: CANARY_INK } }
    : {};

  const links = [
    { href: "/roadmap", label: t("roadmap"), external: false },
    { href: docsHref("/"), label: t("docs"), external: true },
    { href: "/guides", label: t("guides"), external: false },
    { href: "/library", label: t("library"), external: false },
  ];

  return (
    <header className="pointer-events-none relative sticky top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-8 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 right-4 left-4 mx-auto max-w-300 rounded-[12px] bg-background/50 opacity-0 backdrop-blur-xl transition-opacity duration-200 sm:top-8 sm:right-6 sm:left-6 lg:right-10 lg:left-10 in-data-nav-join:opacity-100"
        style={{ height: "var(--nav-join-panel, 0px)" }}
      />
      <div className="pointer-events-auto relative mx-auto flex h-17 max-w-300 items-center justify-between gap-4 rounded-[12px] bg-background/50 px-3 backdrop-blur-xl transition-[background-color,border-radius,backdrop-filter] duration-200 sm:h-21 sm:px-4 in-data-nav-join:rounded-b-none in-data-nav-join:bg-transparent in-data-nav-join:backdrop-blur-none">
        <Link href="/" className="relative flex h-11 w-30 shrink-0 items-center sm:h-15 sm:w-37">
          <BrandLockup
            width={148}
            height={60}
            className="h-full w-auto object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          <NavbarLinks links={links} />
          <ExtensionStoreButton {...storeButtonProps} />
        </nav>

        <button
          type="button"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
          aria-label={t("open-menu")}
          onClick={() => setOpen(true)}
        >
          <RiMenuLine />
        </button>
        {open ? (
          <Suspense fallback={null}>
            <MobileNav
              open={open}
              onOpenChange={setOpen}
              links={links}
              canary={canary}
              menuLabel={t("open-menu")}
            />
          </Suspense>
        ) : null}
      </div>
    </header>
  );
};
