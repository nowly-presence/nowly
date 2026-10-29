import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DOCS_URL, MARKETING_ORIGIN, isSeoPreview } from "@/lib/constants";
import type { Metadata } from "next";
import type { LocaleString } from "@nowly/locales";
import { ogImageUrl } from "@nowly/og";

export const SITE_NAME = "Nowly";

export { OG_IMAGE_VERSION } from "@nowly/og";

export const docsOgImage = (docPath: string, params: {
  title: string;
  description: string;
  category: string;
}): string => {
  const slug = docPath.replace(/^\/+/, "");
  const prefix = slug ? `/api/og/docs/${slug}` : "/api/og/docs";

  return ogImageUrl(prefix, {
    title: params.title,
    description: params.description,
    badge: params.category
  });
};

export const absoluteUrl = (path = "/"): string => {
  if (path.startsWith("http")) return path;

  return `${DOCS_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

type SeoOptions = {
  title: string;
  description: string;
  locale: LocaleString;
  path?: string;
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  alternateLocales?: readonly string[];
  canonicalLocale?: string;
};

export const createMetadata =
  ({ title, description, locale, path = "/", image, type = "website", noIndex = false, alternateLocales = routing.locales, canonicalLocale = locale }: SeoOptions): Metadata => {
    const changelog = path === "/changelog" || path.startsWith("/changelog/");
    const canonicalPath = changelog ? path.replace(/\d+(?:-\d+)+$/, (version) => version.replaceAll("-", ".")) : path;
    const canonicalUrl = (target: string) =>
      `${changelog ? MARKETING_ORIGIN : DOCS_URL}${getPathname({
        locale: target,
        href: canonicalPath
      })}`;
    const url = canonicalUrl(canonicalLocale);
    const languages: Record<string, string> = { "x-default": canonicalUrl(routing.defaultLocale) };

    for (const target of alternateLocales) {
      languages[target] = canonicalUrl(target);
    }

    const imageUrl = absoluteUrl(
      image ??
        docsOgImage(path, {
          title,
          description,
          category: SITE_NAME
        })
    );
    const resolvedTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const hideFromIndex = noIndex || isSeoPreview;

    return {
      metadataBase: new URL(DOCS_URL),
      title: { absolute: resolvedTitle },
      description,
      alternates: {
        canonical: canonicalUrl(canonicalLocale),
        languages
      },
      robots: hideFromIndex ? { index: false, follow: false, nocache: true } : { index: true, follow: true },
      openGraph: {
        type,
        siteName: SITE_NAME,
        locale: canonicalLocale.replaceAll("-", "_"),
        alternateLocale: alternateLocales.filter((target) => target !== canonicalLocale).map((target) => target.replaceAll("-", "_")),
        title: resolvedTitle,
        description,
        url,
        images: imageUrl
          ? [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: title
              }
            ]
          : undefined
      },
      twitter: {
        card: "summary_large_image",
        site: "@nowlyme",
        title: resolvedTitle,
        description,
        images: imageUrl ? [imageUrl] : undefined
      }
    };
  };