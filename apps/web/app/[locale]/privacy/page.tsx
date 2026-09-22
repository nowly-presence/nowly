import { LegalView } from "@/features/legal/components/legal-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("privacy-page")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/privacy",
  });
};

const Page = async () => {
  const t = await getTranslations("privacy-page");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/privacy" />
      <LegalView page="privacy" />
    </>
  );
};

export default Page;
