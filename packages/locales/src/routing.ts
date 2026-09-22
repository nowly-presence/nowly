import { defineRouting } from "next-intl/routing";
import { FALLBACK_LOCALE, LOCALE_SHORT_MAP, SUPPORTED_LOCALES } from "./index";

// Short, clean URL prefixes (/fr, /de, /ja...) instead of the full BCP-47 codes
// used internally (fr-FR, de-DE, ja-JP...). The default locale stays unprefixed.
const prefixes = Object.fromEntries(
  SUPPORTED_LOCALES.filter((locale) => locale !== FALLBACK_LOCALE).map((locale) => [
    locale,
    `/${LOCALE_SHORT_MAP[locale]}`,
  ]),
);

export const appRouting = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: FALLBACK_LOCALE,
  localePrefix: { mode: "as-needed", prefixes },
});
