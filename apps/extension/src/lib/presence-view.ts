import type { Locale } from "@/shared/locales"
import type { PresencePublicationDates } from "@/shared/presence-dates"
import { LOCALE_LONG_MAP } from "@/shared/locales"
import type { PresenceCatalogItem, PresenceMetadata } from "@/shared/types"

type Localized = string | Partial<Record<string, string>> | undefined | null

export const localized = (value: Localized, locale: Locale, fallback = ""): string => {
  if (!value) return fallback
  if (typeof value === "string") return value
  return value[LOCALE_LONG_MAP[locale]] ?? value["en-US"] ?? Object.values(value).find(Boolean) ?? fallback
}

export const localizedList = (value: Record<string, string[]> | undefined, locale: Locale): string[] => {
  if (!value) return []
  return value[LOCALE_LONG_MAP[locale]] ?? value["en-US"] ?? Object.values(value)[0] ?? []
}

export type PresenceView = {
  slug: string
  name: string
  description: string
  longDescription: string
  features: string[]
  category: PresenceMetadata["category"]
  color: string
  author?: { name: string; github?: string }
  contributors: { name: string; github?: string }[]
  version?: string | null
  urls: string[]
  settings?: Record<string, unknown>
  locales?: Record<string, Record<string, string>>
  totalInstalls?: number
  activeUsers?: number
  likes?: number
  addedAt: string | null
  lastUpdated: string | null
  discordNative?: boolean
}

export const fromMetadata = (metadata: PresenceMetadata, locale: Locale, dates: PresencePublicationDates): PresenceView => ({
  slug: metadata.slug,
  name: metadata.name,
  description: localized(metadata.description, locale),
  longDescription: localized(metadata.longDescription, locale),
  features: localizedList(metadata.features, locale),
  category: metadata.category,
  color: metadata.color,
  author: metadata.author,
  contributors: metadata.contributors ?? [],
  version: metadata.version,
  urls: metadata.url ?? [],
  settings: metadata.settings,
  locales: metadata.locales,
  discordNative: metadata.discordNative,
  ...dates,
})

export const fromCatalog = (item: PresenceCatalogItem, locale: Locale): PresenceView => ({
  slug: item.slug,
  name: localized(item.name, locale, item.slug),
  description: localized(item.description, locale),
  longDescription: localized(item.longDescription, locale),
  features: localizedList(item.features, locale),
  category: item.category ?? "other",
  color: item.color ?? "#0891b2",
  author: item.author,
  contributors: item.contributors ?? [],
  version: item.version,
  urls: item.url ?? [],
  settings: item.settings,
  locales: item.locales,
  totalInstalls: item.totalInstalls,
  activeUsers: item.activeUsers,
  likes: item.likes,
  addedAt: item.addedAt,
  lastUpdated: item.lastUpdated,
  discordNative: item.discordNative,
})
