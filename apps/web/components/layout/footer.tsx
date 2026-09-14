"use client";

import { GitHubIcon } from "@/components/icons";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { DISCORD_INVITE_URL, PROJECT_REPOSITORY_URL } from "@/lib/constants";
import { AvatarImage } from "@radix-ui/react-avatar";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC, ReactElement } from "react";
import { FooterLinks } from "./footer-links";
import { LocaleSelector } from "./locale-selector";
import { SupportButton } from "./support-button";

export const Footer: FC = (): ReactElement => {
  const t = useTranslations("footer");
  const pathname = usePathname();
  const isTeamPage = pathname === "/team";
  const teamAvatarClass = isTeamPage ? "grayscale opacity-30 brightness-50 transition duration-200 group-hover/avatar:opacity-100 group-hover/avatar:brightness-100 group-hover/avatar:grayscale-0" : undefined;

  return (
    <footer className="py-12 border-t border-border text-dim-foreground text-sm">
      <div className="mx-auto w-full max-w-300 min-w-0 px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <AvatarGroup className="-space-x-4">
                <Avatar size="lg" className="z-6">
                  <AvatarImage
                    src="https://avatars.githubusercontent.com/u/51194216?v=4"
                    alt={t("author-alt")}
                    className={teamAvatarClass}
                  />
                </Avatar>

                <Avatar size="lg" className="z-4">
                  <AvatarImage
                    src="https://avatars.githubusercontent.com/steellgold?v=4"
                    alt="steellgold"
                    className={teamAvatarClass}
                  />
                </Avatar>
              </AvatarGroup>

              <div className="min-w-0 text-left">
                <p className="text-muted-foreground font-medium">Nowly</p>
                <p className="opacity-60 text-xs">{t("copyright")}</p>
              </div>
            </div>

            <small className="opacity-50 text-xs max-w-56 leading-relaxed">
              {t("trademark")}{" "}
              <Link
                href="https://discord.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                Discord Inc
              </Link>
              .
            </small>

            <div className="flex items-center gap-3 flex-wrap">
              <SupportButton />

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
                <span>{t("discord")}</span>
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
                <GitHubIcon className="w-4 h-4" />
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
