import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { StatusView } from "@/components/status/status-view";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.status");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/status",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.status");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/status" />
      <StatusView />
    </>
  );
};

export default Page;
