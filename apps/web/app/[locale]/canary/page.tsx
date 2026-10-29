import { CanaryView } from "@/features/canary/components/canary-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { CANARY_ACCENT } from "@/lib/brand";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("pages.canary")
  ]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/canary",
    accent: CANARY_ACCENT
  });
};

const Page = async () => {
  const t = await getTranslations("pages.canary");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/canary" />
      <CanaryView />
    </>
  );
};

export default Page;