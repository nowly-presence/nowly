import type { LocaleShort as Locale } from "@nowly/locales";
import en from "@messages/en.json";
import fr from "@messages/fr.json";
import es from "@messages/es.json";
import de from "@messages/de.json";
import ptBR from "@messages/pt-BR.json";
import pl from "@messages/pl.json";
import ja from "@messages/ja.json";
import ko from "@messages/ko.json";
import tr from "@messages/tr.json";
import ms from "@messages/ms.json";
import el from "@messages/el.json";

const messages = { en, fr, es, de, "pt-BR": ptBR, pl, ja, ko, tr, ms, el };
const LOCALE_PREFERENCE_KEY = "localePreference";

export type LocalePreference = Locale | "browser";

let localePreference: LocalePreference = "browser";

const getBrowserLocale = (): Locale => {
  const language = chrome.i18n.getUILanguage().toLowerCase();
  if (language.startsWith("fr")) return "fr";
  if (language.startsWith("es")) return "es";
  if (language.startsWith("de")) return "de";
  if (language.startsWith("pt")) return "pt-BR";
  if (language.startsWith("pl")) return "pl";
  if (language.startsWith("ja")) return "ja";
  if (language.startsWith("ko")) return "ko";
  if (language.startsWith("tr")) return "tr";
  if (language.startsWith("ms")) return "ms";
  if (language.startsWith("el")) return "el";
  return "en";
};

export const resolveLocale = (preference: LocalePreference = localePreference): Locale =>
  preference === "browser" ? getBrowserLocale() : preference;

export const getLocalePreference = (): LocalePreference => localePreference;

export const loadLocalePreference = async (): Promise<LocalePreference> => {
  const value = await chrome.storage.local.get(LOCALE_PREFERENCE_KEY);
  const preference = value[LOCALE_PREFERENCE_KEY];

  localePreference =
    preference === "fr" ||
    preference === "en" ||
    preference === "es" ||
    preference === "de" ||
    preference === "pt-BR" ||
    preference === "pl" ||
    preference === "ja" ||
    preference === "ko" ||
    preference === "tr" ||
    preference === "ms" ||
    preference === "el"
      ? preference
      : "browser";
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
