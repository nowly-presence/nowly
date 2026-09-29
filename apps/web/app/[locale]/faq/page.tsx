import { FaqPageView } from "@/features/faq/components/faq-page-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("faqPage")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/faq",
  });
};

const FaqPage = async () => {
  const t = await getTranslations("faqPage");

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/faq" />
      <FaqPageView />
    </>
  );
};

export default FaqPage;
