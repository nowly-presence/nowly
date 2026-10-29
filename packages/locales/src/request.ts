import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import type { LocaleString } from "./index";
import { appRouting } from "./routing";

export const createRequestConfig = (loadMessages: (locale: LocaleString) => Record<string, unknown> | Promise<Record<string, unknown>>) =>
  getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;

    const locale = hasLocale(appRouting.locales, requested) ? requested : appRouting.defaultLocale;

    return {
      locale,
      messages: await loadMessages(locale)
    };
  });