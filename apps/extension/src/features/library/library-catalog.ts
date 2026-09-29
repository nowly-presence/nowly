import type { Locale } from "@/shared/locales"
import type { PresenceMetadata } from "@/shared/types"
import type { PresenceView } from "@/lib/presence-view"

export type LibrarySort = "popular" | "new" | "name"
export type LibraryCategory = PresenceMetadata["category"] | "all"

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000
const NEW_BADGE_LIMIT = 5
const TRENDING_COUNT = 6
const ACTIVE_USER_WEIGHT = 10

export const addedTime = (view: PresenceView): number => (view.addedAt ? Date.parse(view.addedAt) || 0 : 0)

const publicationDay = (view: PresenceView): string => new Date(addedTime(view)).toISOString().slice(0, 10)

export const newPresenceSlugs = (views: PresenceView[], now = Date.now()): Set<string> => {
  const recent = views.filter((view) => addedTime(view) > now - NEW_WINDOW_MS).sort((a, b) => addedTime(b) - addedTime(a))
  const days = [...new Set(recent.map(publicationDay))]
  const slugs = new Set<string>()
  for (const day of days) {
    const batch = recent.filter((view) => publicationDay(view) === day)
    if (slugs.size + batch.length > NEW_BADGE_LIMIT) break
    for (const view of batch) slugs.add(view.slug)
  }
  return slugs
}

export const normalizeSearch = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()

const popularity = (view: PresenceView): number => (view.activeUsers ?? 0) * ACTIVE_USER_WEIGHT + (view.totalInstalls ?? 0)

export const filterCatalog = (
  views: PresenceView[],
  { category, query, sort, locale }: { category: LibraryCategory; query: string; sort: LibrarySort; locale: Locale },
): PresenceView[] => {
  const needle = normalizeSearch(query.trim())
  const byName = (a: PresenceView, b: PresenceView) => a.name.localeCompare(b.name, locale)
  return views
    .filter((view) => category === "all" || view.category === category)
    .filter((view) => !needle || [view.name, view.slug, view.description, ...view.urls].some((field) => normalizeSearch(field).includes(needle)))
    .sort((a, b) => {
      if (sort === "name") return byName(a, b)
      if (sort === "new") return addedTime(b) - addedTime(a) || byName(a, b)
      return popularity(b) - popularity(a) || byName(a, b)
    })
}

export const trendingPresences = (views: PresenceView[]): PresenceView[] =>
  views
    .filter((view) => (view.activeUsers ?? 0) > 0 || (view.totalInstalls ?? 0) > 0)
    .sort((a, b) => (b.activeUsers ?? 0) - (a.activeUsers ?? 0) || (b.totalInstalls ?? 0) - (a.totalInstalls ?? 0))
    .slice(0, TRENDING_COUNT)
