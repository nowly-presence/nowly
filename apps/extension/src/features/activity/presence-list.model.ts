import { t } from "@/shared/i18n"
import type { InstalledPresences, PresenceMetadata } from "@/shared/types"

export type PresenceListEntry = [string, InstalledPresences[string]]
export type PresenceCategory = PresenceMetadata["category"]

type MessageKey = Parameters<typeof t>[0]

const categoryLabelKeys: Record<PresenceCategory, MessageKey> = {
  ai: "categoryAi",
  creator: "categoryCreator",
  gaming: "categoryGaming",
  learning: "categoryLearning",
  music: "categoryMusic",
  other: "categoryOther",
  social: "categorySocial",
  streaming: "categoryStreaming",
  tools: "categoryTools",
  video: "categoryVideo",
}

export const getCategoryLabel = (category: PresenceCategory): string => t(categoryLabelKeys[category])

export const matchesPresenceSearch = (slug: string, presence: InstalledPresences[string], query: string): boolean => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  const name = presence.metadata.name.toLowerCase()
  const category = getCategoryLabel(presence.metadata.category).toLowerCase()
  const urls = (presence.metadata.url ?? []).join(" ").toLowerCase()
  return name.includes(normalized) || slug.toLowerCase().includes(normalized) || category.includes(normalized) || urls.includes(normalized)
}

export const groupByCategory = (entries: PresenceListEntry[]): Array<[PresenceCategory, PresenceListEntry[]]> => {
  const groups = new Map<PresenceCategory, PresenceListEntry[]>()

  for (const entry of entries) {
    const [, presence] = entry
    const category = presence.metadata.category
    groups.set(category, [...(groups.get(category) ?? []), entry])
  }

  return Array.from(groups.entries()).sort(([left], [right]) => getCategoryLabel(left).localeCompare(getCategoryLabel(right)))
}
