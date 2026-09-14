"use client";

import { GitHubIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { DISCORD_INVITE_URL, PROJECT_REPOSITORY_URL, SITE_URL } from "@/lib/constants";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";
import { FooterLinks } from "./footer-links";
import { LocaleSelector } from "./locale-selector";

export const Footer: FC = (): ReactElement => {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border py-12 text-sm text-dim-foreground">
      <div className="mx-auto w-full min-w-0 max-w-300 px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-6">
            <Link href={`${SITE_URL}/`} className="text-muted-foreground font-medium">
              Nowly
            </Link>
            <p className="text-xs opacity-60">{t("copyright")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  className: "text-muted-foreground hover:border-zinc-500/40 hover:text-foreground hover:bg-zinc-500/10 text-xs sm:text-sm px-2 sm:px-3",
                  size: "sm",
                  variant: "secondary",
                })}
              >
                {t("discord")}
              </Link>
              <Link
                href={PROJECT_REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({
                  className: "text-muted-foreground hover:border-zinc-500/40 hover:text-foreground hover:bg-zinc-500/10 text-xs sm:text-sm px-2 sm:px-3",
                  size: "sm",
                  variant: "secondary",
                })}
              >
                <GitHubIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t("open-source")}</span>
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-end gap-6">
            <FooterLinks />
            <LocaleSelector />
          </div>
        </div>
      </div>
    </footer>
  );
};
