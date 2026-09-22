import { ExtensionView } from "@/components/extension/extension-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.extension")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/extension",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.extension");
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/extension" />
      <ExtensionView />
    </>
  );
};

export default Page;
