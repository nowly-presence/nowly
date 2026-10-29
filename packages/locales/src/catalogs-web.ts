import type { MessageLoader } from "@nowly/locales/messages";
import type { LocaleString } from "@nowly/locales";

const catalogs: Record<LocaleString, MessageLoader> = {
  "en-US": () => import("@nowly/locales/messages/web/en-US.json"),
  "fr-FR": () => import("@nowly/locales/messages/web/fr-FR.json"),
  "es-ES": () => import("@nowly/locales/messages/web/es-ES.json"),
  "de-DE": () => import("@nowly/locales/messages/web/de-DE.json"),
  "pt-BR": () => import("@nowly/locales/messages/web/pt-BR.json"),
  "pl-PL": () => import("@nowly/locales/messages/web/pl-PL.json"),
  "ja-JP": () => import("@nowly/locales/messages/web/ja-JP.json"),
  "ko-KR": () => import("@nowly/locales/messages/web/ko-KR.json"),
  "tr-TR": () => import("@nowly/locales/messages/web/tr-TR.json"),
  "ms-MY": () => import("@nowly/locales/messages/web/ms-MY.json"),
  "el-GR": () => import("@nowly/locales/messages/web/el-GR.json")
};

export default catalogs;