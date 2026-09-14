"use client";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SITE_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconDownload, IconMenu2 } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

export const Navbar: FC = (): ReactElement => {
  const t = useTranslations("navbar");

  return (
    <nav className={cn("fixed top-0 right-0 left-0 z-50 bg-background/35 py-4 backdrop-blur-xl")}>
      <div className="mx-auto w-full min-w-0 max-w-300 px-6">
        <div className="flex min-w-0 items-center justify-between">
          <Link href={`${SITE_URL}/`} className="min-w-0 shrink-0 cursor-pointer select-none">
            <img src="https://cdn.nowly.me/assets/app_title.png" alt="Nowly" width={420} height={128} className="h-8 w-auto" />
          </Link>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="hover:bg-card-hover inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Open menu"
                >
                  <IconMenu2 size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" showCloseButton={false}>
                <div className="flex flex-col gap-6 px-6 pt-12">
                  <SheetClose asChild>
                    <Link href="/" className="text-lg font-semibold text-foreground transition-colors hover:text-accent">
                      {t("docs")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href={`${SITE_URL}/library`} className="text-lg font-semibold text-foreground transition-colors hover:text-accent">
                      {t("marketplace")}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href={`${SITE_URL}/#download`}
                      className={buttonVariants({ size: "md", variant: "accent", className: "justify-center" })}
                    >
                      <IconDownload size={16} />
                      {t("download-extension")}
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <Link href="/" className={buttonVariants({ size: "md", variant: "ghost" })}>
              {t("docs")}
            </Link>
            <Link href={`${SITE_URL}/library`} className={buttonVariants({ size: "md", variant: "ghost" })}>
              {t("marketplace")}
            </Link>
            <Link href={`${SITE_URL}/#download`} className={buttonVariants({ size: "md", variant: "accent" })}>
              <IconDownload size={16} />
              {t("download-extension")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
