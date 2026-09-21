import { getCategoryLabel, type PresenceCategory } from "@/features/activity/presence-list.model"
import { resolveLocaleList, resolveLocaleString } from "@/features/activity/presence-locale"
import type { PresenceCatalogItem } from "@/shared/types"

const CATEGORIES: PresenceCategory[] = ["streaming", "music", "video", "social", "gaming", "tools", "ai", "learning", "creator", "other"]

export type StorePresence = {
  slug: string
  name: string
  description: string
  longDescription: string
  category: PresenceCategory
  color: string
  author?: { name: string; github?: string }
  contributors?: { name: string; github?: string }[]
  version: string | null
  urls: string[]
  features: string[]
  settings?: Record<string, unknown>
  locales?: Record<string, Record<string, string>>
  totalInstalls: number
  discordNative: boolean
}

const toCategory = (value: unknown): PresenceCategory =>
  CATEGORIES.includes(value as PresenceCategory) ? (value as PresenceCategory) : "other"

export const toStorePresence = (item: PresenceCatalogItem): StorePresence => {
  const description = resolveLocaleString(item.description) ?? ""
  return {
    slug: item.slug,
    name: resolveLocaleString(item.name) ?? item.slug,
    description,
    longDescription: resolveLocaleString(item.longDescription) ?? description,
    category: toCategory(item.category),
    color: typeof item.color === "string" && item.color.length > 0 ? item.color : "#0891B2",
    author: item.author,
    contributors: item.contributors,
    version: item.version ?? null,
    urls: [...new Set(item.url ?? [])],
    features: resolveLocaleList(item.features),
    settings: item.settings,
    locales: item.locales,
    totalInstalls: item.totalInstalls ?? 0,
    discordNative: item.discordNative === true,
  }
}

export const catalogCategories = (items: StorePresence[]): PresenceCategory[] => {
  const present = new Set(items.map((item) => item.category))
  return CATEGORIES.filter((category) => present.has(category))
}

export const filterStorePresences = (items: StorePresence[], query: string, category: PresenceCategory | null): StorePresence[] => {
  const normalized = query.trim().toLowerCase()
  return [...items]
    .filter((item) => (category ? item.category === category : true))
    .filter((item) => {
      if (!normalized) return true
      return (
        item.name.toLowerCase().includes(normalized) ||
        item.description.toLowerCase().includes(normalized) ||
        item.slug.toLowerCase().includes(normalized) ||
        item.urls.some((url) => url.toLowerCase().includes(normalized))
      )
    })
    .sort((left, right) => {
      if (right.totalInstalls !== left.totalInstalls) return right.totalInstalls - left.totalInstalls
      return left.name.localeCompare(right.name)
    })
}

export const storeCategoryLabel = getCategoryLabel
