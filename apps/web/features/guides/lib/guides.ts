import { contentLocales, contentSlugs, getContentEntries, getContentEntry, readingMinutes, type ContentEntry } from "@/features/content/lib/content-files";
import { SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";

export const GUIDE_CATEGORIES = ["start", "troubleshooting", "privacy", "discord", "developers"] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export type Guide = {
  slug: string
  title: string
  description: string
  category: GuideCategory
  updated: string | null
  order: number
  minutes: number
  related: string[]
  entry: ContentEntry
};

const isGuideCategory = (value: string | undefined): value is GuideCategory =>
  GUIDE_CATEGORIES.includes(value as GuideCategory);

const isIsoDate = (value: string | undefined): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

const toGuide = (entry: ContentEntry): Guide => ({
  slug: entry.slug,
  title: entry.meta.title ?? entry.slug,
  description: entry.meta.description ?? "",
  category: isGuideCategory(entry.meta.category) ? entry.meta.category : "start",
  updated: isIsoDate(entry.meta.updated) ? entry.meta.updated : null,
  order: Number(entry.meta.order ?? 100),
  minutes: readingMinutes(entry.words),
  related: (entry.meta.related ?? "").split(",").map((slug) => slug.trim()).filter(Boolean),
  entry,
});

const byOrder = (a: Guide, b: Guide): number => a.order - b.order || a.title.localeCompare(b.title);

export const getGuides = (locale: string): Guide[] => getContentEntries("guides", locale).map(toGuide).sort(byOrder);

export const getGuide = (slug: string, locale: string): Guide | null => {
  const entry = getContentEntry("guides", slug, locale);
  return entry ? toGuide(entry) : null;
};

export const relatedGuides = (guide: Guide, all: Guide[], limit = 3): Guide[] => {
  const others = all.filter((item) => item.slug !== guide.slug);
  const picked = guide.related
    .map((slug) => others.find((item) => item.slug === slug))
    .filter((item): item is Guide => Boolean(item));
  const sameCategory = others.filter((item) => item.category === guide.category && !picked.includes(item));
  const rest = others.filter((item) => !picked.includes(item) && !sameCategory.includes(item));
  return [...picked, ...sameCategory, ...rest].slice(0, limit);
};

// Locales with at least one translated guide: the guides index is only indexed there, the
// other locales list English guides and point their canonical to the English index.
export const guidesIndexLocales = (): LocaleString[] => {
  const written = new Set(contentSlugs("guides").flatMap((slug) => contentLocales("guides", slug)));
  return SUPPORTED_LOCALES.filter((locale) => written.has(locale));
};
