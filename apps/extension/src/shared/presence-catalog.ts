import { publicationDates } from "@/shared/presence-dates"
import type { PresenceCatalogItem } from "@/shared/types"

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null

export const normalizeCatalogItem = (raw: unknown): PresenceCatalogItem | null => {
  if (!isRecord(raw) || typeof raw.slug !== "string" || !raw.slug) return null
  return { ...(raw as Omit<PresenceCatalogItem, "addedAt" | "lastUpdated">), slug: raw.slug, ...publicationDates(raw) }
}

export const normalizeCatalog = (data: unknown): PresenceCatalogItem[] => {
  if (!Array.isArray(data)) throw new Error("INVALID_CATALOG")
  return data.flatMap((raw) => {
    const item = normalizeCatalogItem(raw)
    return item ? [item] : []
  })
}
