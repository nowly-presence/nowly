import { LegalView } from "@/features/legal/components/legal-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("cookies-page")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/cookies",
  });
};

const Page = async () => {
  const t = await getTranslations("cookies-page");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/cookies" />
      <LegalView page="cookies" />
    </>
  );
};

export default Page;
