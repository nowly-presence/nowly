const localeCodes = {
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
  "el-GR": "el"
} as const;

export type LocaleString = keyof typeof localeCodes;
export type LocaleShort = (typeof localeCodes)[LocaleString];

export const SUPPORTED_LOCALES = Object.keys(localeCodes) as readonly LocaleString[];
export const SHORT_LOCALES: readonly LocaleShort[] = Object.values(localeCodes);
export const FALLBACK_LOCALE: LocaleString = "en-US";
export const LOCALE_SHORT_MAP: Readonly<Record<LocaleString, LocaleShort>> = localeCodes;
export const LOCALE_LONG_MAP = Object.fromEntries(SUPPORTED_LOCALES.map((locale) => [localeCodes[locale], locale])) as Readonly<
  Record<LocaleShort, LocaleString>
>;

export const isValidLocale = (locale: string): locale is LocaleString => SUPPORTED_LOCALES.includes(locale as LocaleString);