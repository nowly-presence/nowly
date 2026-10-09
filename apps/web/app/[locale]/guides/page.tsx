import { GuidesView } from "@/features/guides/components/guides-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { guidesIndexLocales } from "@/features/guides/lib/guides";
import { createMetadata } from "@/features/seo/lib/seo";
import { FALLBACK_LOCALE, getValidLocale } from "@nowly/locales";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.guides")]);
  const indexLocales = guidesIndexLocales();
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/guides",
    alternateLocales: indexLocales,
    canonicalLocale: indexLocales.includes(getValidLocale(locale)) ? undefined : FALLBACK_LOCALE,
  });
};

const Page = async () => {
  const t = await getTranslations("pages.guides");
  return (
    <>
      <WebPageJsonLd
        name={t("title")}
        description={t("description")}
        path="/guides"
        crumbs={[
          { name: "Nowly", path: "/" },
          { name: t("title"), path: "/guides" },
        ]}
      />
      <GuidesView />
    </>
  );
};

export default Page;
