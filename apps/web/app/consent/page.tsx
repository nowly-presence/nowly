import { ConsentView } from "@/components/consent/consent-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.consent");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/consent",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.consent");

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/consent" />
      <ConsentView />
    </>
  );
};

export default Page;
