import { UninstallView } from "@/components/uninstall/uninstall-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.uninstall")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/uninstall",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.uninstall");

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/uninstall" />
      <Suspense>
        <UninstallView />
      </Suspense>
    </>
  );
};

export default Page;
