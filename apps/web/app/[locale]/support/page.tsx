import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { SupportView } from "@/features/support/components/support-view";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.support")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/support",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.support");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/support" />
      <SupportView />
    </>
  );
};

export default Page;
