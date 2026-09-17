import { LegalView } from "@/components/legal/legal-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("cookies-page");
  return createMetadata({
    title: t("title"),
    description: t("description"),
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
