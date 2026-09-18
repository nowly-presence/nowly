import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { SupportView } from "@/components/support/support-view";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.support");
  return createMetadata({
    title: t("title"),
    description: t("description"),
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
