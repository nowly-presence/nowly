import { BRAND_LOCKUP_BLUE_PNG } from "@/lib/brand";
import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://nowly.me").replace(/\/$/, "");
export const DOCS_URL = (process.env.NEXT_PUBLIC_DOCS_BASE_URL ?? "https://docs.nowly.me").replace(/\/$/, "");
export const SITE_NAME = "Nowly";
export const DEFAULT_OG_IMAGE = BRAND_LOCKUP_BLUE_PNG;

export const docsHref = (path = "/"): string => {
  let normalized = path.trim() || "/";
  if (!normalized.startsWith("/")) normalized = `/${normalized}`;
  if (normalized === "/docs") normalized = "/";
  else if (normalized.startsWith("/docs/")) normalized = normalized.slice("/docs".length);
  return `${DOCS_URL}${normalized}`;
};

export const absoluteUrl = (path = "/", origin = SITE_URL): string => {
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
};

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
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  return {
    title: { absolute: resolvedTitle },
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
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
      title: resolvedTitle,
      description,
      images: [imageUrl],
    },
  };
};

export const jsonLd = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");
