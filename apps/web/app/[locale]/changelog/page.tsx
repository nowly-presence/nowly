import { ChangelogView } from "@/features/changelog/components/changelog-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.changelog")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/changelog",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.changelog");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/changelog" />
      <ChangelogView />
    </>
  );
};

export default Page;
