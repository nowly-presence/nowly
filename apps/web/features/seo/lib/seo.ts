import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { BRAND_LOCKUP_BLUE } from "@/lib/brand";
import {
  DISCORD_INVITE_URL,
  KOFI_URL,
  PROJECT_REPOSITORY_URL,
  TWITTER_URL,
} from "@/lib/constants";
import type { LocaleString } from "@nowly/locales";
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
export const OG_IMAGE_VERSION = "1";

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

export const webOgImage = (params: {
  title: string
  description: string
  badge?: string
  accent?: string
  logo?: string
}): string => {
  const search = new URLSearchParams({
    title: params.title,
    description: params.description,
    v: OG_IMAGE_VERSION,
  });
  if (params.badge) search.set("badge", params.badge);
  if (params.accent) search.set("accent", params.accent);
  if (params.logo) search.set("logo", params.logo);
  return `/api/og?${search.toString()}`;
};

type SeoOptions = {
  title: string
  description: string
  // Widened to `string` since `getLocale()` isn't narrowed to `LocaleString` - the routing
  // integration guarantees it's always one of `routing.locales` at runtime.
  locale: string
  path?: string
  keywords?: string[]
  image?: string
  badge?: string
  accent?: string
  logo?: string
  noIndex?: boolean
};

// The <title> tag reads well with a "Nowly | X" / "X | Nowly" pattern, but repeating that
// pipe as the OG image's giant headline looks broken next to the logo that already says "Nowly".
export const ogHeadline = (title: string): string =>
  title
    .replace(new RegExp(`^${SITE_NAME}\\s*\\|\\s*`, "i"), "")
    .replace(new RegExp(`\\s*\\|\\s*${SITE_NAME}$`, "i"), "");

export const createMetadata = ({
  title,
  description,
  locale,
  path = "/",
  keywords = [],
  image,
  badge,
  accent,
  logo,
  noIndex = false,
}: SeoOptions): Metadata => {
  const localeString = locale as LocaleString;
  const url = absoluteUrl(getPathname({ locale: localeString, href: path }), CANONICAL_ORIGIN);
  const languages: Record<string, string> = {
    "x-default": absoluteUrl(getPathname({ locale: routing.defaultLocale, href: path }), CANONICAL_ORIGIN),
  };
  for (const target of routing.locales) {
    languages[target] = absoluteUrl(getPathname({ locale: target, href: path }), CANONICAL_ORIGIN);
  }
  const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  // Unlike the canonical/alternates URLs above (which must always point at production for SEO),
  // the OG image is fetched directly by whatever crawler renders the page (Discord, Slack, ...) -
  // it has to resolve on the host actually serving the page, not on production when previewing.
  const imageUrl = absoluteUrl(image ?? webOgImage({ title: ogHeadline(resolvedTitle), description, badge, accent, logo }), SITE_URL);
  const hideFromIndex = noIndex || isSeoPreview;

  return {
    metadataBase: new URL(CANONICAL_ORIGIN),
    title: { absolute: resolvedTitle },
    description,
    keywords,
    alternates: { canonical: url, languages },
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
      site: "@nowlyme",
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
