import { LegalView } from "@/components/legal/legal-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("legal-notice-page")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/legal-notice",
  });
};

const Page = async () => {
  const t = await getTranslations("legal-notice-page");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/legal-notice" />
      <LegalView page="legal-notice" />
    </>
  );
};

export default Page;
