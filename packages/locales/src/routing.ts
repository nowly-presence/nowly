import { defineRouting } from "next-intl/routing";
import { FALLBACK_LOCALE, LOCALE_SHORT_MAP, SUPPORTED_LOCALES } from "./codes";

const prefixes = Object.fromEntries(SUPPORTED_LOCALES.filter((locale) => locale !== FALLBACK_LOCALE).map((locale) => [locale, `/${LOCALE_SHORT_MAP[locale]}`]));

export const appRouting = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: FALLBACK_LOCALE,
  localePrefix: {
    mode: "as-needed",
    prefixes
  }
});