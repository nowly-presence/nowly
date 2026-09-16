import { BRAND_METADATA_ICONS } from "@/lib/brand";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("metadata");

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      default: t("title"),
      template: `%s | ${SITE_NAME}`,
    },
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    robots: { index: true, follow: true },
    manifest: "/manifest.json",
    icons: BRAND_METADATA_ICONS,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: SITE_URL,
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEF5FC" },
    { media: "(prefers-color-scheme: dark)", color: "#07080C" },
  ],
  width: "device-width",
  initialScale: 1,
};
