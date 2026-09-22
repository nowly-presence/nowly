import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { ThemeToggle } from "@/features/layout/components/theme-toggle";
import { Footer as SharedFooter, FOOTER_DISCORD_SITE_URL, LocaleSelector } from "@nowly/ui";

import type { LocaleString } from "@nowly/locales";
import { getLocale, getTranslations } from "next-intl/server";

export const Footer = async () => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("footer")]);

  return (
    <SharedFooter
      locale={locale as LocaleString}
      brand={<BrandLockup width={119} height={48} className="h-14 w-auto" />}
      actions={
        <>
          <LocaleSelector />
          <ThemeToggle />
        </>
      }
      labels={{
        product: t("product"),
        home: t("home"),
        library: t("library"),
        host: t("host"),
        resources: t("resources"),
        docs: t("docs"),
        changelog: t("changelog"),
        canary: t("canary"),
        support: t("support"),
        status: t("status"),
        branding: t("branding"),
        community: t("community"),
        discord: t("discord"),
        github: t("github"),
        twitter: t("twitter"),
        legalNotice: t("legal-notice"),
        cookies: t("cookies"),
        privacy: t("privacy"),
        consent: t("consent"),
        tos: t("tos"),
        tagline: t("tagline"),
        copyright: t("copyright"),
        trademark: t.rich("trademark", {
          inc: (chunks) => (
            <a
              href={FOOTER_DISCORD_SITE_URL}
              rel="noreferrer"
              target="_blank"
              className="underline decoration-foreground/15 underline-offset-4 transition-colors hover:text-muted-foreground"
            >
              {chunks}
            </a>
          ),
        }),
      }}
    />
  );
};
