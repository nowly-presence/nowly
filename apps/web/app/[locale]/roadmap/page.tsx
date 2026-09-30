import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { RoadmapView } from "@/features/roadmap/components/roadmap-view";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.roadmap")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/roadmap",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.roadmap");

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/roadmap" />
      <RoadmapView />
    </>
  );
};

export default Page;
