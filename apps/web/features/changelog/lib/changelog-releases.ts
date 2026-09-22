import { getChangelogEntry, getChangelogList, parseChangelogVersion, type ChangelogStore } from "@nowly/changelog";

export type ChangelogRelease = {
  version: string
  slug: string
  date: string | null
  summary: string
  banner?: string
  stores?: ChangelogStore[]
};

const toRelease = (entry: { slug: string; version: string; date: string | null; description: string; banner?: string; stores?: ChangelogStore[] }): ChangelogRelease => ({
  version: entry.version,
  slug: entry.slug,
  date: entry.date,
  summary: entry.description,
  banner: entry.banner,
  stores: entry.stores,
});

// For each store, only the most recent release that shipped to it should show that
// store's badge - older releases stay unbadged even if their own frontmatter also
// lists the store, since the badge means "this is what's currently live there", not
// "this release was also available there at the time".
export const latestReleaseSlugByStore = (releases: ChangelogRelease[]): Partial<Record<ChangelogStore, string>> => {
  const latest: Partial<Record<ChangelogStore, string>> = {};
  for (const release of releases) {
    for (const store of release.stores ?? []) {
      if (!(store in latest)) latest[store] = release.slug;
    }
  }
  return latest;
};

export const getChangelogReleases = (locale: string): ChangelogRelease[] => getChangelogList(locale).map(toRelease);

export const getChangelogRelease = (value: string, locale: string): ChangelogRelease | null => {
  const entry = getChangelogEntry(value, locale);
  return entry ? toRelease(entry) : null;
};

export { parseChangelogVersion };
export { formatChangelogDate } from "@/features/changelog/lib/format-changelog-date";
