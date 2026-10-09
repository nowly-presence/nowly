import { BrandLockup } from "@/features/layout/components/brand-lockup";
import { FooterActions } from "@/features/layout/components/footer-actions";
import { Footer as SharedFooter, FOOTER_DISCORD_SITE_URL } from "@nowly/ui/footer";
import type { LocaleString } from "@nowly/locales";
import { getLocale, getTranslations } from "next-intl/server";

export const Footer = async () => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("footer")]);

  return (
    <SharedFooter
      locale={locale as LocaleString}
      brand={<BrandLockup width={119} height={48} className="h-14 w-auto" />}
      actions={<FooterActions />}
      labels={{
        product: t("product"),
        home: t("home"),
        library: t("library"),
        host: t("host"),
        resources: t("resources"),
        docs: t("docs"),
        guides: t("guides"),
        changelog: t("changelog"),
        canary: t("canary"),
        faq: t("faq"),
        support: t("support"),
        status: t("status"),
        branding: t("branding"),
        community: t("community"),
        discord: t("discord"),
        company: t("company"),
        about: t("about"),
        contact: t("contact"),
        github: t("github"),
        twitter: t("twitter"),
        bluesky: t("bluesky"),
        tiktok: "TikTok",
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
