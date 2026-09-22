import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { BRAND_METADATA_ICONS } from "@/lib/brand";
import {
  absoluteUrl,
  CANONICAL_ORIGIN,
  isSeoPreview,
  ogHeadline,
  SITE_NAME,
  webOgImage,
} from "@/lib/seo";
import type { LocaleString } from "@nowly/locales";
import type { Metadata, Viewport } from "next";
import { getTranslations } from "next-intl/server";

type LayoutProps = {
  params: Promise<{ locale: LocaleString }>
};

export const generateMetadata = async ({ params }: LayoutProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations("metadata");
  const title = t("title");
  const description = t("description");
  const imageUrl = absoluteUrl(webOgImage({ title: ogHeadline(title), description }), CANONICAL_ORIGIN);
  const languages: Record<string, string> = {
    "x-default": absoluteUrl(getPathname({ locale: routing.defaultLocale, href: "/" }), CANONICAL_ORIGIN),
  };
  for (const target of routing.locales) {
    languages[target] = absoluteUrl(getPathname({ locale: target, href: "/" }), CANONICAL_ORIGIN);
  }

  return {
    metadataBase: new URL(CANONICAL_ORIGIN),
    applicationName: SITE_NAME,
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords: t.raw("keywords") as string[],
    robots: isSeoPreview
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    manifest: "/manifest.json",
    icons: BRAND_METADATA_ICONS,
    alternates: {
      canonical: absoluteUrl(getPathname({ locale, href: "/" }), CANONICAL_ORIGIN),
      languages,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: CANONICAL_ORIGIN,
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@nowlyme",
      title,
      description,
      images: [imageUrl],
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
