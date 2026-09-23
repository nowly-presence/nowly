import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { FundsView } from "@/features/funds/components/funds-view";
import { createMetadata } from "@/features/seo/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.funds")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/funds",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.funds");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/funds" />
      <FundsView />
    </>
  );
};

export default Page;