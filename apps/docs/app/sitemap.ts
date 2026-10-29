import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DOCS_URL, isSeoPreview } from "@/lib/constants";
import { getNavigationItems, getDocLocales } from "@/features/docs-content/lib/content";
import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
  if (isSeoPreview) return [];

  return getNavigationItems(routing.defaultLocale)
    .filter((section) => section.slug !== "changelog")
    .flatMap((section) => section.children)
    .flatMap((page) => {
      const locales = getDocLocales(page.path);
      const url = (locale: string) =>
        `${DOCS_URL}${getPathname({
          locale,
          href: `/${page.path}`
        })}`;
      const languages = Object.fromEntries(
        locales.map((locale) => [
          locale,
          url(locale)
        ])
      );
      languages["x-default"] = url(routing.defaultLocale);

      return locales.map((locale) => ({
        url: url(locale),
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: { languages }
      }));
    });
};

export default sitemap;