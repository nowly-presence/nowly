import { ConsentView } from "@/features/consent/components/consent-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.consent")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/consent",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.consent");

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/consent" />
      <ConsentView />
    </>
  );
};

export default Page;
