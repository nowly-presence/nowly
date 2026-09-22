import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { StatusView } from "@/features/status/components/status-view";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.status")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
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
