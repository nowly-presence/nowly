import type { LocaleShort, LocaleString } from "@nowly/locales"

export type Locale = LocaleShort
export type LongLocale = LocaleString
export const UI_LOCALES = ["en", "fr", "es", "de", "pt-BR", "pl", "ja", "ko", "tr", "ms", "el"] as const
export const LOCALE_LONG_MAP: Record<Locale, LongLocale> = {
  en: "en-US",
  fr: "fr-FR",
  es: "es-ES",
  de: "de-DE",
  "pt-BR": "pt-BR",
  pl: "pl-PL",
  ja: "ja-JP",
  ko: "ko-KR",
  tr: "tr-TR",
  ms: "ms-MY",
  el: "el-GR",
}

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  de: "Deutsch",
  "pt-BR": "Português (Brasil)",
  pl: "Polski",
  ja: "日本語",
  ko: "한국어",
  tr: "Türkçe",
  ms: "Bahasa Melayu",
  el: "Ελληνικά",
}

export const PRESENCE_LOCALES: readonly LongLocale[] = UI_LOCALES.map((code) => LOCALE_LONG_MAP[code])

export const isLongLocale = (value: unknown): value is LongLocale => typeof value === "string" && (PRESENCE_LOCALES as readonly string[]).includes(value)

export const longLocaleName = (code: LongLocale): string => LOCALE_NAMES[UI_LOCALES.find((locale) => LOCALE_LONG_MAP[locale] === code) ?? "en"]

export const LOCALE_PREFERENCE_KEY = "localePreference"
export type LocalePreference = Locale | "browser"

export const isLocale = (value: unknown): value is Locale => typeof value === "string" && (UI_LOCALES as readonly string[]).includes(value)

export const browserLocale = (): Locale => {
  const language = ((typeof chrome !== "undefined" && chrome.i18n?.getUILanguage?.()) || navigator.language || "en").toLowerCase()
  if (language.startsWith("pt")) return "pt-BR"
  const base = language.split(/[-_]/)[0]
  return (UI_LOCALES as readonly string[]).includes(base) ? (base as Locale) : "en"
}

export const resolveLocale = (preference: LocalePreference | undefined): Locale =>
  preference && preference !== "browser" ? preference : browserLocale()

export const loadLocale = async (): Promise<Locale> => {
  const stored = await chrome.storage.local.get(LOCALE_PREFERENCE_KEY)
  const value = stored[LOCALE_PREFERENCE_KEY]
  return resolveLocale(isLocale(value) ? value : "browser")
}
