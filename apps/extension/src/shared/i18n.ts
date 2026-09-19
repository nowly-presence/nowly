import type { LocaleShort as Locale } from "@nowly/locales";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import es from "@messages/es.json";

const messages = { en, fr, es };
const LOCALE_PREFERENCE_KEY = "localePreference";

export type LocalePreference = Locale | "browser";

let localePreference: LocalePreference = "browser";

const getBrowserLocale = (): Locale => {
  const language = chrome.i18n.getUILanguage().toLowerCase();
  if (language.startsWith("fr")) return "fr";
  if (language.startsWith("es")) return "es";
  return "en";
};

export const resolveLocale = (preference: LocalePreference = localePreference): Locale =>
  preference === "browser" ? getBrowserLocale() : preference;

export const getLocalePreference = (): LocalePreference => localePreference;

export const loadLocalePreference = async (): Promise<LocalePreference> => {
  const value = await chrome.storage.local.get(LOCALE_PREFERENCE_KEY);
  const preference = value[LOCALE_PREFERENCE_KEY];

  localePreference = preference === "fr" || preference === "en" || preference === "es" ? preference : "browser";
  return localePreference;
};

export const setLocalePreference = async (preference: LocalePreference): Promise<void> => {
  localePreference = preference;
  await chrome.storage.local.set({ [LOCALE_PREFERENCE_KEY]: preference });
};

export const getLocale = (): Locale =>
  resolveLocale();

export const t = (key: keyof typeof fr, params: Record<string, string> = {}): string => {
  const locale = getLocale();
  let value = messages[locale][key] ?? messages.fr[key] ?? key;
  for (const [name, replacement] of Object.entries(params)) {
    value = value.replace(`{${name}}`, replacement);
  }
  return value;
};
