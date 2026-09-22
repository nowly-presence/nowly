import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import type { LocaleString } from "./index";
import { appRouting } from "./routing";

// Each app's messages/*.json live in the app itself (not this package), so the loader
// is passed in - only the locale negotiation (cookie/header -> validated locale) is shared.
export const createRequestConfig = (loadMessages: (locale: LocaleString) => Promise<Record<string, unknown>>) =>
  getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = hasLocale(appRouting.locales, requested) ? requested : appRouting.defaultLocale;

    return {
      locale,
      messages: await loadMessages(locale),
    };
  });
