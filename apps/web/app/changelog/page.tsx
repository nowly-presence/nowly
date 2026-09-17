import { ChangelogView } from "@/components/changelog/changelog-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.changelog");
  return createMetadata({
    title: t("title"),
    description: t("description"),
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
