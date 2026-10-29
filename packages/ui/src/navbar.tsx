"use client";

import { NavbarLinks } from "@nowly/ui/navbar-links";
import { buttonVariants } from "@nowly/ui/button-variants";
import { cn } from "@nowly/ui/utils";
import { RiMenuLine } from "@remixicon/react";
import { useState, type ReactNode } from "react";
import { MobileNav } from "@nowly/ui/navbar-mobile";

import { Link } from "@nowly/locales/navigation";
import { FALLBACK_LOCALE, LOCALE_SHORT_MAP, getValidLocale } from "@nowly/locales";
import { useLocale, useTranslations } from "next-intl";

export const Navbar = ({ site, docsOrigin, brand, storeButton }: {
  site: "web" | "docs";
  docsOrigin: string;
  brand: ReactNode;
  storeButton: ReactNode;
}) => {
  const t = useTranslations("navbar");
  const locale = getValidLocale(useLocale());
  const [open, setOpen] = useState(false);
  const prefix = locale === FALLBACK_LOCALE ? "" : `/${LOCALE_SHORT_MAP[locale]}`;
  const webHref = (path: string) => (site === "web" ? path : `https://nowly.me${prefix}${path}`);

  const links = [
    {
      href: webHref("/roadmap"),
      label: t("roadmap"),
      external: site !== "web"
    },
    {
      href: site === "docs" ? "/" : `${docsOrigin.replace(/\/$/, "")}${prefix}/`,
      label: t("docs"),
      external: site !== "docs"
    },
    {
      href: webHref("/guides"),
      label: t("guides"),
      external: site !== "web"
    },
    {
      href: webHref("/library"),
      label: t("library"),
      external: site !== "web"
    }
  ];

  return (
    <header className="pointer-events-none relative sticky top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-8 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 right-4 left-4 mx-auto max-w-300 rounded-[12px] bg-background/50 opacity-0 backdrop-blur-xl transition-opacity duration-200 sm:top-8 sm:right-6 sm:left-6 lg:right-10 lg:left-10 in-data-nav-join:opacity-100"
        style={{ height: "var(--nav-join-panel, 0px)" }}
      />
      <div className="pointer-events-auto relative mx-auto flex h-17 max-w-300 items-center justify-between gap-4 rounded-[12px] bg-background/50 px-3 backdrop-blur-xl transition-[background-color,border-radius,backdrop-filter] duration-200 sm:h-21 sm:px-4 in-data-nav-join:rounded-b-none in-data-nav-join:bg-transparent in-data-nav-join:backdrop-blur-none">
        {site === "web" ? (
          <Link href="/" aria-label="Nowly" className="relative flex h-11 w-30 shrink-0 items-center sm:h-15 sm:w-37">
            {brand}
          </Link>
        ) : (
          <a href={webHref("/")} aria-label="Nowly" className="relative flex h-11 w-30 shrink-0 items-center sm:h-15 sm:w-37">
            {brand}
          </a>
        )}

        <nav className="hidden items-center gap-5 lg:flex">
          <NavbarLinks links={links} />
          {storeButton}
        </nav>

        <button
          type="button"
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "icon"
            }),
            "lg:hidden"
          )}
          aria-label={t("open-menu")}
          onClick={() => setOpen(true)}
        >
          <RiMenuLine />
        </button>
        {open ? <MobileNav open={open} onOpenChange={setOpen} links={links} storeButton={storeButton} menuLabel={t("open-menu")} /> : null}
      </div>
    </header>
  );
};