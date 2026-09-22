import { DesktopView } from "@/components/desktop/desktop-view";
import { WebPageJsonLd } from "@/components/seo/web-page-json-ld";
import { getDesktopRelease } from "@/lib/desktop-release";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("pages.desktop")]);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/desktop",
  });
};

const Page = async () => {
  const [release, t] = await Promise.all([getDesktopRelease(), getTranslations("pages.desktop")]);
  return (
    <>
      <WebPageJsonLd name={t("title")} description={t("description")} path="/desktop" />
      <DesktopView release={release} />
    </>
  );
};

export default Page;
