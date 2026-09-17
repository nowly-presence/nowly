import { DOCS_URL, isSeoPreview } from "@/lib/constants";
import type { Metadata } from "next";

export const SITE_NAME = "Nowly";
export const OG_IMAGE_VERSION = "2";

export const docsOgImage = (
  docPath: string,
  params: {
    title: string
    description: string
    category: string
  },
): string => {
  const search = new URLSearchParams({
    title: params.title,
    description: params.description,
    category: params.category,
    mode: "dark",
    v: OG_IMAGE_VERSION,
  });
  const slug = docPath.replace(/^\/+/, "");
  const prefix = slug ? `/api/og/docs/${slug}` : "/api/og/docs";

  return `${prefix}?${search.toString()}`;
};

export const absoluteUrl = (path = "/"): string => {
  if (path.startsWith("http")) return path;
  return `${DOCS_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

type SeoOptions = {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "article"
  noIndex?: boolean
};

export const createMetadata = ({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noIndex = false,
}: SeoOptions): Metadata => {
  const url = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : undefined;
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const hideFromIndex = noIndex || isSeoPreview;

  return {
    metadataBase: new URL(DOCS_URL),
    title: { absolute: resolvedTitle },
    description,
    alternates: { canonical: url },
    robots: hideFromIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: resolvedTitle,
      description,
      url,
      images: imageUrl
        ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: "@nowly",
      title: resolvedTitle,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
};
