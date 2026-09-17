import { BRAND_LOCKUP_BLUE, BRAND_LOCKUP_BLUE_PNG } from "@/lib/brand";
import {
  DISCORD_INVITE_URL,
  KOFI_URL,
  PROJECT_REPOSITORY_URL,
  TWITTER_URL,
} from "@/lib/constants";
import type { Metadata } from "next";

export const CANONICAL_ORIGIN = "https://nowly.me";
export const DOCS_ORIGIN = "https://docs.nowly.me";

const trimOrigin = (value: string): string => value.replace(/\/$/, "");

const hostnameOf = (value: string): string => {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
};

export const SITE_URL = trimOrigin(process.env.NEXT_PUBLIC_BASE_URL ?? CANONICAL_ORIGIN);
export const DOCS_URL = DOCS_ORIGIN;
export const SITE_NAME = "Nowly";
export const DEFAULT_OG_IMAGE = BRAND_LOCKUP_BLUE_PNG;

const seoHost = hostnameOf(SITE_URL);
export const isSeoPreview =
  seoHost !== "" && seoHost !== "nowly.me" && seoHost !== "www.nowly.me";

export const docsHref = (path = "/"): string => {
  let normalized = path.trim() || "/";
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized === "/docs") normalized = "/";
  else if (normalized.startsWith("/docs/")) normalized = normalized.slice("/docs".length);
  return `${DOCS_ORIGIN}${normalized}`;
};

export const absoluteUrl = (path = "/", origin = CANONICAL_ORIGIN): string => {
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
};

export const seoUrl = (path = "/"): string => absoluteUrl(path, CANONICAL_ORIGIN);

type SeoOptions = {
  title: string
  description: string
  path?: string
  keywords?: string[]
  image?: string
  noIndex?: boolean
};

export const createMetadata = ({
  title,
  description,
  path = "/",
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
}: SeoOptions): Metadata => {
  const url = seoUrl(path);
  const imageUrl = absoluteUrl(image, CANONICAL_ORIGIN);
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const hideFromIndex = noIndex || isSeoPreview;

  return {
    metadataBase: new URL(CANONICAL_ORIGIN),
    title: { absolute: resolvedTitle },
    description,
    keywords,
    alternates: { canonical: url },
    robots: hideFromIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: resolvedTitle,
      description,
      url,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@nowly",
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  };
};

export const jsonLd = (data: Record<string, unknown> | Record<string, unknown>[]): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");

export const organizationJsonLd = (): Record<string, unknown> => ({
  "@type": "Organization",
  "@id": `${CANONICAL_ORIGIN}/#organization`,
  name: SITE_NAME,
  url: CANONICAL_ORIGIN,
  logo: BRAND_LOCKUP_BLUE,
  sameAs: [PROJECT_REPOSITORY_URL, DISCORD_INVITE_URL, TWITTER_URL, KOFI_URL],
});
