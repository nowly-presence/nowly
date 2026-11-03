import catalogs from "@nowly/locales/catalogs/account";
import type { LocaleString } from "@nowly/locales";
import { loadCatalog } from "@nowly/locales/messages";
import { loadSharedMessages } from "@nowly/locales/messages/shared";

export const loadAccountMessages = async (locale: LocaleString) => {
  const [messages, shared] = await Promise.all([
    loadCatalog(catalogs, locale),
    loadSharedMessages(locale)
  ]);
  return { ...messages, ...shared };
};