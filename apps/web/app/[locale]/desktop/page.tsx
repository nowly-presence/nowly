import { DesktopView } from "@/features/desktop/components/desktop-view";
import { WebPageJsonLd } from "@/features/seo/components/web-page-json-ld";
import { getDesktopRelease } from "@/features/desktop/lib/desktop-release";
import { createMetadata } from "@/features/seo/lib/seo";
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
