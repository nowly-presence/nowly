import { BrandLockup } from "@/components/layout/brand-lockup";
import { LocaleSelector } from "@/components/layout/locale-selector";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Separator } from "@nowly/ui";

import { DISCORD_INVITE_URL, DISCORD_SITE_URL, PROJECT_REPOSITORY_URL, TWITTER_URL } from "@/lib/constants";
import { docsHref } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const Footer = async () => {
  const t = await getTranslations("footer");

  const columns = [
    {
      title: t("product"),
      links: [
        { href: "/", label: t("home") },
        { href: "/library", label: t("library") },
        { href: "/desktop", label: t("host") },
      ],
    },
    {
      title: t("resources"),
      links: [
        { href: docsHref("/"), label: t("docs"), external: true },
        { href: "/changelog", label: t("changelog") },
        { href: "/canary", label: t("canary") },
        { href: "/support", label: t("support") },
        { href: "/status", label: t("status") },
        { href: "/branding", label: t("branding") },
      ],
    },
    {
      title: t("community"),
      links: [
        { href: DISCORD_INVITE_URL, label: t("discord"), external: true },
        { href: PROJECT_REPOSITORY_URL, label: t("github"), external: true },
        { href: TWITTER_URL, label: t("twitter"), external: true },
      ],
    },
  ];

  const legal = [
    { href: "/legal-notice", label: t("legal-notice") },
    { href: "/cookies", label: t("cookies") },
    { href: "/privacy", label: t("privacy") },
    { href: "/consent", label: t("consent") },
    { href: "/tos", label: t("tos") },
  ];

  return (
    <footer className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8 lg:px-9">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-xs">
          <BrandLockup width={119} height={48} className="h-14 w-auto" />
          <p className="mt-3 text-base text-muted-foreground">{t("tagline")}</p>
          <div className="mt-5 flex items-center gap-2">
            <LocaleSelector />
            <ThemeToggle />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-16">
          {columns.map((column) => (
            <div key={column.title} className="text-sm leading-relaxed text-muted-foreground">
              <p className="font-bold">{column.title}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition-opacity hover:opacity-80"
                      {...("external" in link && link.external ? { rel: "noreferrer", target: "_blank" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Separator className="mx-auto mt-16 max-w-[1280px]" />
      <div className="mx-auto mt-5 flex max-w-[1280px] flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p>{t("copyright")}</p>
          <p className="text-muted-foreground/55">
            {t.rich("trademark", {
              inc: (chunks) => (
                <a
                  href={DISCORD_SITE_URL}
                  rel="noreferrer"
                  target="_blank"
                  className="underline decoration-foreground/15 underline-offset-4 transition-colors hover:text-muted-foreground"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
          {legal.map((link) => (
            <Link key={link.href} href={link.href} className="hover:opacity-80">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
};
