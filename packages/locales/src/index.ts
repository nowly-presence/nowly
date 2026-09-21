import { z } from "zod"

// --- Locale codes ---
export const SUPPORTED_LOCALES = ["en-US", "fr-FR", "es-ES", "de-DE", "pt-BR", "pl-PL", "ja-JP", "ko-KR", "tr-TR", "ms-MY", "el-GR"] as const
export type LocaleString = (typeof SUPPORTED_LOCALES)[number]

// --- Localized value containers ---
export type LocalizedValue<T = string> = Partial<Record<LocaleString, T>>

// --- Fallback ---
export const FALLBACK_LOCALE: LocaleString = "en-US"

// --- Validation helpers ---
export const isValidLocale = (locale: string): locale is LocaleString =>
  SUPPORTED_LOCALES.includes(locale as LocaleString)

export const getValidLocale = (locale: string, fallback: LocaleString = FALLBACK_LOCALE): LocaleString =>
  isValidLocale(locale) ? locale : fallback

// --- Object builders ---
export const buildLocaleObject = <T>(value: T): Record<LocaleString, T> =>
  Object.fromEntries(SUPPORTED_LOCALES.map(l => [l, value])) as Record<LocaleString, T>

export const buildLocalizedValue = <T>(map: Partial<Record<LocaleString, T>>, fallback: T): Record<LocaleString, T> =>
  Object.fromEntries(SUPPORTED_LOCALES.map(l => [l, map[l] ?? fallback])) as Record<LocaleString, T>

// --- Short locale (extension uses "en", "fr", "es", ...) ---
export type LocaleShort = "en" | "fr" | "es" | "de" | "pt-BR" | "pl" | "ja" | "ko" | "tr" | "ms" | "el"
export const LOCALE_SHORT_MAP: Record<LocaleString, LocaleShort> = {
  "en-US": "en",
  "fr-FR": "fr",
  "es-ES": "es",
  "de-DE": "de",
  "pt-BR": "pt-BR",
  "pl-PL": "pl",
  "ja-JP": "ja",
  "ko-KR": "ko",
  "tr-TR": "tr",
  "ms-MY": "ms",
  "el-GR": "el",
}
export const LOCALE_LONG_MAP: Record<LocaleShort, LocaleString> = {
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

// --- Zod schemas ---
export const LocaleSchema = z.enum(SUPPORTED_LOCALES)
export const LocaleRecordSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object(
    Object.fromEntries(SUPPORTED_LOCALES.map(l => [l, valueSchema]))
  ) as z.ZodObject<Record<LocaleString, T>>
