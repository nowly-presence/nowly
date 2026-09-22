import { UninstallView } from "@/features/uninstall/components/uninstall-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { createMetadata } from "@/features/seo/lib/seo";
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
