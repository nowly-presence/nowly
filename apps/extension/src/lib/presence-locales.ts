import { PRESENCE_LOCALES, type LongLocale } from "@/shared/locales"
import type { InstalledPresences } from "@/shared/types"

export const presenceLocalesOf = (locales: Record<string, unknown> | undefined): LongLocale[] =>
  PRESENCE_LOCALES.filter((code) => Boolean(locales && code in locales))

export const commonPresenceLocales = (presences: InstalledPresences): LongLocale[] => {
  const translated = Object.values(presences)
    .map((stored) => presenceLocalesOf(stored.metadata.locales))
    .filter((codes) => codes.length > 0)
  if (translated.length === 0) return [...PRESENCE_LOCALES]
  return PRESENCE_LOCALES.filter((code) => translated.every((codes) => codes.includes(code)))
}
