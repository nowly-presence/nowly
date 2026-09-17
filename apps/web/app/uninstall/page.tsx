import { UninstallView } from "@/components/uninstall/uninstall-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("pages.uninstall");
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: "/uninstall",
  });
};

const Page = async () => {
  const t = await getTranslations("pages.uninstall");

  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/uninstall" />
      <UninstallView />
    </>
  );
};

export default Page;
