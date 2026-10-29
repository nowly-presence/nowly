import catalogs from "@nowly/locales/catalogs/shared";
import type { LocaleString } from "@nowly/locales";
import { loadCatalog } from "@nowly/locales/messages";

export const loadSharedMessages = (locale: LocaleString) => loadCatalog(catalogs, locale);