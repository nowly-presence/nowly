import { BRAND_METADATA_ICONS } from "@/lib/brand";
import {
  CANONICAL_ORIGIN,
  DEFAULT_OG_IMAGE,
  isSeoPreview,
  SITE_NAME,
} from "@/lib/seo";
import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("metadata");

  return {
    metadataBase: new URL(CANONICAL_ORIGIN),
    applicationName: SITE_NAME,
    title: {
      default: t("title"),
      template: `%s | ${SITE_NAME}`,
    },
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    robots: isSeoPreview
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    manifest: "/manifest.json",
    icons: BRAND_METADATA_ICONS,
    alternates: { canonical: CANONICAL_ORIGIN },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: CANONICAL_ORIGIN,
      title: t("title"),
      description: t("description"),
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@nowly",
      title: t("title"),
      description: t("description"),
      images: [DEFAULT_OG_IMAGE],
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
