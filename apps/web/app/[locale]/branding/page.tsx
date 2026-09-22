import { BrandingView } from "@/features/branding/components/branding-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.branding")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/branding",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.branding");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/branding" />
      <BrandingView />
    </>
  );
};

export default Page;
