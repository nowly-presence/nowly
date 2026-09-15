import { BRAND_METADATA_ICONS } from "@/lib/brand";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO, SITE_NAME, SITE_URL } from "@/lib/seo";
import type { Metadata, Viewport } from "next";

const APP_DEFAULT_TITLE = DEFAULT_SEO.title;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO.description,
  keywords: DEFAULT_SEO.keywords,
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: BRAND_METADATA_ICONS,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: APP_DEFAULT_TITLE,
    description: DEFAULT_SEO.description,
    images: [{
      url: DEFAULT_OG_IMAGE,
      width: 1200,
      height: 630,
      alt: APP_DEFAULT_TITLE
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_DEFAULT_TITLE,
    description: DEFAULT_SEO.description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: "#22d3ee",
  width: "device-width",
  initialScale: 1,
};