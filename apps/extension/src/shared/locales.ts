import { isValidLocale, LOCALE_SHORT_MAP, SHORT_LOCALES, SUPPORTED_LOCALES, type LocaleShort, type LocaleString } from "@nowly/locales/codes";

export { LOCALE_LONG_MAP } from "@nowly/locales/codes";

export type Locale = LocaleShort;
export type LongLocale = LocaleString;

export const UI_LOCALES = SHORT_LOCALES;

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
  el: "Ελληνικά"
};

export const PRESENCE_LOCALES = SUPPORTED_LOCALES;

export const isLongLocale = (value: unknown): value is LongLocale => typeof value === "string" && isValidLocale(value);

export const longLocaleName = (code: LongLocale): string => LOCALE_NAMES[LOCALE_SHORT_MAP[code] ?? "en"];

export const LOCALE_PREFERENCE_KEY = "localePreference";

export type LocalePreference = Locale | "browser";

export const isLocale = (value: unknown): value is Locale => UI_LOCALES.some((locale) => locale === value);

export const browserLocale = (): Locale => {
  const language = ((typeof chrome !== "undefined" && chrome.i18n?.getUILanguage?.()) || navigator.language || "en").toLowerCase();

  if (language.startsWith("pt")) return "pt-BR";

  const base = language.split(/[-_]/)[0];
  return isLocale(base) ? base : "en";
};

export const resolveLocale = (preference: LocalePreference | undefined): Locale => (preference && preference !== "browser" ? preference : browserLocale());

export const loadLocale = async (): Promise<Locale> => {
  const stored = await chrome.storage.local.get(LOCALE_PREFERENCE_KEY);

  const value = stored[LOCALE_PREFERENCE_KEY];
  return resolveLocale(isLocale(value) ? value : "browser");
};