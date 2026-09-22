"use client";

import { RiMenuLine } from "@nowly/ui/icons";
import { ExtensionStoreButton } from "@/components/extension-store-button";
import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@nowly/ui";


import { Link, usePathname } from "@/i18n/navigation";
import { CANARY_ACCENT, CANARY_INK } from "@/lib/brand";
import { docsHref } from "@/features/seo/lib/seo";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const Navbar = () => {
  const t = useTranslations("navbar");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const canary = pathname === "/canary";
  const storeButtonProps = canary
    ? { className: "border-transparent hover:brightness-110", style: { backgroundColor: CANARY_ACCENT, color: CANARY_INK } }
    : {};

  const links = [
    { href: docsHref("/"), label: t("docs"), external: true },
    { href: "/library", label: t("library"), external: false },
  ];

  return (
    <header className="pointer-events-none relative sticky top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-8 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute top-4 right-4 left-4 mx-auto max-w-[1200px] rounded-[12px] bg-background/50 opacity-0 backdrop-blur-xl transition-opacity duration-200 sm:top-8 sm:right-6 sm:left-6 lg:right-10 lg:left-10 [[data-nav-join]_&]:opacity-100"
        style={{ height: "var(--nav-join-panel, 0px)" }}
      />
      <div className="pointer-events-auto relative mx-auto flex h-[68px] max-w-[1200px] items-center justify-between gap-4 rounded-[12px] bg-background/50 px-3 backdrop-blur-xl transition-[background-color,border-radius,backdrop-filter] duration-200 sm:h-[84px] sm:px-4 [[data-nav-join]_&]:rounded-b-none [[data-nav-join]_&]:bg-transparent [[data-nav-join]_&]:backdrop-blur-none">
        <Link href="/" className="relative flex h-11 w-[120px] shrink-0 items-center sm:h-[60px] sm:w-[148px]">
          <BrandLockup
            width={148}
            height={60}
            className="h-full w-auto object-contain object-left"
          />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-foreground transition-opacity hover:opacity-80"
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground transition-opacity hover:opacity-80"
              >
                {link.label}
              </Link>
            ),
          )}
          <ExtensionStoreButton {...storeButtonProps} />
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={t("open-menu")}
              />
            }
          >
            <RiMenuLine />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,20rem)] bg-background p-0 lg:hidden">
            <SheetHeader>
              <SheetTitle>{t("open-menu")}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-3 px-4 pb-6">
              {links.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-foreground"
                    onClick={() => setOpen(false)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ),
              )}
              <ExtensionStoreButton {...storeButtonProps} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
