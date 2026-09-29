import type { MessageKey } from "@/hooks/i18n-provider"
import type { PresenceMetadata } from "@/shared/types"

type Category = PresenceMetadata["category"]

const CATEGORY_KEYS: Record<Category, MessageKey> = {
  streaming: "category.streaming",
  music: "category.music",
  video: "category.video",
  social: "category.social",
  gaming: "category.gaming",
  tools: "category.tools",
  ai: "category.ai",
  learning: "category.learning",
  creator: "category.creator",
  other: "category.other",
}

export const CATEGORIES = Object.keys(CATEGORY_KEYS) as Category[]

export const categoryKey = (category: Category): MessageKey => CATEGORY_KEYS[category]
