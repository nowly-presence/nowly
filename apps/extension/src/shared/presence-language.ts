import { LOCALE_LONG_MAP, type Locale, type LongLocale } from "@/shared/locales"
import type { ExtensionSettings } from "@/shared/types"

type LanguageSettings = Pick<ExtensionSettings, "presenceLanguage" | "presenceLanguages">

export const defaultPresenceLocale = (locales: Record<string, unknown> | undefined, uiLocale: Locale): LongLocale => {
  const preferred = LOCALE_LONG_MAP[uiLocale]
  return locales && preferred in locales ? preferred : "en-US"
}

export const configuredPresenceLocale = (settings: LanguageSettings, slug: string, locales: Record<string, unknown> | undefined, uiLocale: Locale): LongLocale => {
  const mode = settings.presenceLanguage
  if (mode && mode !== "per-presence") return mode
  return settings.presenceLanguages?.[slug] ?? defaultPresenceLocale(locales, uiLocale)
}
