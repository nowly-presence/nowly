import "server-only";

import { contentLocales } from "@/features/content/lib/content-files";
import type { LibraryPresence } from "@/lib/library-catalog";
import { FALLBACK_LOCALE, SUPPORTED_LOCALES } from "@nowly/locales";

export const presenceIndexLocales = (presence: LibraryPresence) => {
  const locales = new Set([...presence.locales, ...contentLocales("presences", presence.slug)]);
  if (locales.size === 0) locales.add(FALLBACK_LOCALE);
  return SUPPORTED_LOCALES.filter((locale) => locales.has(locale));
};
