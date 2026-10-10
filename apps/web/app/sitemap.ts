import { FALLBACK_LOCALE, type LocaleString } from "@nowly/locales";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getChangelogReleases } from "@/features/changelog/lib/changelog-releases";
import { getGuides, guidesIndexLocales } from "@/features/guides/lib/guides";
import { catalogGithubHandles } from "@/lib/library-catalog";
import { presenceIndexLocales } from "@/lib/library-catalog-server";
import { getPresenceCatalog } from "@/lib/presence-api";
import { isSeoPreview, seoUrl } from "@/features/seo/lib/seo";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

// Some changelog entries carry a non-date placeholder (e.g. "To be determined")
// instead of a real release date - fall back rather than crash the sitemap build.
const parseDate = (value: string | null): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

type Entry = {
  href: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
  lastModified?: Date
  // Locales with their own text. Defaults to every locale (fully translated pages).
  locales?: readonly LocaleString[]
};

const entry = (
  href: string,
  changeFrequency: Entry["changeFrequency"],
  priority: number,
  options: Pick<Entry, "lastModified" | "locales"> = {},
): Entry => ({ href, changeFrequency, priority, ...options });

const languageAlternates = (href: string, locales: readonly LocaleString[]): Record<string, string> =>
  Object.fromEntries(locales.map((locale) => [locale, seoUrl(getPathname({ locale, href }))]));

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  if (isSeoPreview) return [];

  const catalog = await getPresenceCatalog().catch(() => []);
  const authors = catalogGithubHandles(catalog);
  const guides = getGuides(FALLBACK_LOCALE);

  const entries: Entry[] = [
    entry("/", "weekly", 1),
    entry("/library", "weekly", 0.9),
    entry("/guides", "weekly", 0.85, { locales: guidesIndexLocales() }),
    ...guides.map((guide) =>
      entry(`/guides/${guide.slug}`, "monthly", 0.8, {
        lastModified: parseDate(guide.updated),
        locales: guide.entry.locales,
      }),
    ),
    entry("/faq", "monthly", 0.75),
    entry("/desktop", "monthly", 0.7),
    entry("/extension", "monthly", 0.7),
    entry("/about", "monthly", 0.6),
    entry("/canary", "weekly", 0.55),
    entry("/branding", "monthly", 0.4),
    entry("/changelog", "monthly", 0.6),
    ...getChangelogReleases(FALLBACK_LOCALE).map((release) =>
      entry(`/changelog/${release.version}`, "yearly", 0.5, { lastModified: parseDate(release.date) }),
    ),
    entry("/support", "monthly", 0.6),
    entry("/status", "hourly", 0.4),
    ...catalog.map((presence) =>
      entry(`/library/${presence.slug}`, "weekly", 0.75, { locales: presenceIndexLocales(presence) }),
    ),
    ...authors.map((github) => entry(`/author/${github}`, "weekly", 0.45, { locales: [FALLBACK_LOCALE] })),
    entry("/privacy", "yearly", 0.3),
    entry("/consent", "yearly", 0.3),
    entry("/tos", "yearly", 0.3),
    entry("/cookies", "yearly", 0.3),
    entry("/legal-notice", "yearly", 0.3),
  ];

  return entries.flatMap(({ href, changeFrequency, priority, lastModified, locales = routing.locales }) =>
    locales.map((locale) => ({
      url: seoUrl(getPathname({ locale, href })),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency,
      priority,
      alternates: { languages: languageAlternates(href, locales) },
    })),
  );
};

export default sitemap;
