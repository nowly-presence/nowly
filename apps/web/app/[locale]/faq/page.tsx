import { FaqSection } from "@/features/home/components/faq-section";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("faq")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/faq",
  });
};

const FaqPage = async () => {
  const t = await getTranslations("faq");

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/faq" />
      <h1 className="sr-only">{t("title")}</h1>
      <FaqSection />
    </>
  );
};

export default FaqPage;
