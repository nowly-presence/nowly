import { getChangelogEntry, getChangelogList, parseChangelogVersion } from "@nowly/changelog";

export type ChangelogRelease = {
  version: string
  slug: string
  date: string | null
  summary: string
  banner?: string
};

const toRelease = (entry: { slug: string; version: string; date: string | null; description: string; banner?: string }): ChangelogRelease => ({
  version: entry.version,
  slug: entry.slug,
  date: entry.date,
  summary: entry.description,
  banner: entry.banner,
});

export const getChangelogReleases = (locale: string): ChangelogRelease[] => getChangelogList(locale).map(toRelease);

export const getChangelogRelease = (value: string, locale: string): ChangelogRelease | null => {
  const entry = getChangelogEntry(value, locale);
  return entry ? toRelease(entry) : null;
};

export const formatChangelogDate = (date: string, locale: string): string => {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(year, month - 1, day));
};

export { parseChangelogVersion };
