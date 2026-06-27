"use client";

import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBrowser } from "@/hooks/use-browser";
import { cn } from "@/lib/utils";
import { IconDownload, IconMenu2 } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

export const Navbar: FC = (): ReactElement => {
  const browser = useBrowser();
  const t = useTranslations("navbar");

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300",
        "bg-background/35 backdrop-blur-xl"
      )}
    >
      <div className="mx-auto w-full max-w-300 min-w-0 px-6">
        <div className="flex min-w-0 items-center justify-between">
          <Link href="/" className="min-w-0 shrink-0 cursor-pointer select-none">
            <img src="https://cdn.nowly.me/assets/app_title.png" alt="Nowly" width={420} height={128} className="h-8 w-auto" />
          </Link>

          {/* Mobile: hamburger menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-card-hover transition-colors"
                  aria-label="Open menu"
                >
                  <IconMenu2 size={22} />
                </button>
              </SheetTrigger>

              <SheetContent side="right" showCloseButton={false}>
                <div className="flex flex-col gap-6 px-6 pt-12">
                  <SheetClose asChild>
                    <Link
                      href="/docs"
                      className="text-lg font-semibold text-foreground hover:text-accent transition-colors"
                    >
                      {t("docs")}
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      href="/library"
                      className="text-lg font-semibold text-foreground hover:text-accent transition-colors"
                    >
                      {t("marketplace")}
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: nav links + download button */}
          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <Link href="/docs"
              className={buttonVariants({ size: "md", variant: "ghost" })}
            >
              {t("docs")}
            </Link>

            <Link href="/library"
              className={buttonVariants({ size: "md", variant: "ghost" })}
            >
              {t("marketplace")}
            </Link>

            <Link
              href="/#download"
              className={buttonVariants({ size: "md", variant: "accent" })}
            >
              <IconDownload size={16} />

              <span className="hidden sm:inline">
                {browser ? t("download-for", { browser }) : t("download-desktop")}
              </span>
              <span className="sm:hidden">{browser || t("download-short")}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};