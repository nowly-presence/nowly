import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getChangelogReleases } from "@/lib/changelog-releases";
import { catalogGithubHandles } from "@/lib/library-catalog";
import { getPresenceCatalog } from "@/lib/presence-api";
import { isSeoPreview, seoUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

// Some changelog entries carry a non-date placeholder (e.g. "To be determined")
// instead of a real release date - fall back rather than crash the sitemap build.
const parseReleaseDate = (value: string | null): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const languageAlternates = (href: string): Record<string, string> =>
  Object.fromEntries(routing.locales.map((locale) => [locale, seoUrl(getPathname({ locale, href }))]));

type Entry = {
  href: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
  lastModified?: Date
};

const entry = (
  href: string,
  changeFrequency: Entry["changeFrequency"],
  priority: number,
  lastModified?: Date,
): Entry => ({ href, changeFrequency, priority, lastModified });

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  if (isSeoPreview) return [];

  const catalog = await getPresenceCatalog().catch(() => []);
  const authors = catalogGithubHandles(catalog);

  const entries: Entry[] = [
    entry("/", "weekly", 1),
    entry("/library", "weekly", 0.9),
    entry("/desktop", "monthly", 0.7),
    entry("/extension", "monthly", 0.7),
    entry("/canary", "weekly", 0.55),
    entry("/branding", "monthly", 0.4),
    entry("/changelog", "monthly", 0.6),
    ...getChangelogReleases("en-US").map((release) =>
      entry(
        `/changelog/${release.version}`,
        "monthly",
        0.5,
        parseReleaseDate(release.date),
      ),
    ),
    entry("/support", "monthly", 0.6),
    entry("/status", "hourly", 0.4),
    ...catalog.map((presence) => entry(`/library/${presence.slug}`, "weekly", 0.75)),
    ...authors.map((github) => entry(`/author/${github}`, "weekly", 0.45)),
    entry("/privacy", "yearly", 0.3),
    entry("/consent", "yearly", 0.3),
    entry("/tos", "yearly", 0.3),
    entry("/cookies", "yearly", 0.3),
    entry("/legal-notice", "yearly", 0.3),
  ];

  return routing.locales.flatMap((locale) =>
    entries.map(({ href, changeFrequency, priority, lastModified }) => ({
      url: seoUrl(getPathname({ locale, href })),
      lastModified: lastModified ?? new Date(),
      changeFrequency,
      priority,
      alternates: { languages: languageAlternates(href) },
    })),
  );
};

export default sitemap;
