import type { LongLocale } from "@/shared/locales"
import type { PresenceSchedule } from "@/shared/types/presence"

export type PresenceDisplayMode = "category" | "grid"
export type AppearanceMode = "system" | "light" | "dark"
export type PresenceLocale = LongLocale
export type PresenceLanguageMode = "per-presence" | PresenceLocale
export type ActivitySelectionMode = "focused" | "priority"

export type ExtensionSettings = {
  presenceDisplayMode: PresenceDisplayMode
  showPlayer: boolean
  suggestPresences?: boolean
  presencePaused?: boolean
  developerMode?: boolean
  customApiBaseUrl?: string
  scheduleEnabled?: boolean
  globalSchedule?: PresenceSchedule
  appearance?: AppearanceMode
  backgroundAnimation?: boolean
  presenceLanguage?: PresenceLanguageMode
  presenceLanguages?: Record<string, PresenceLocale>
  activitySelectionMode?: ActivitySelectionMode
  activityPriorityOrder?: string[]
}
