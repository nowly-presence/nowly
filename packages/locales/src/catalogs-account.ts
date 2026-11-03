import type { MessageLoader } from "@nowly/locales/messages";
import type { LocaleString } from "@nowly/locales";

const catalogs: Record<LocaleString, MessageLoader> = {
  "en-US": () => import("@nowly/locales/messages/account/en-US.json"),
  "fr-FR": () => import("@nowly/locales/messages/account/fr-FR.json"),
  "es-ES": () => import("@nowly/locales/messages/account/es-ES.json"),
  "de-DE": () => import("@nowly/locales/messages/account/de-DE.json"),
  "pt-BR": () => import("@nowly/locales/messages/account/pt-BR.json"),
  "pl-PL": () => import("@nowly/locales/messages/account/pl-PL.json"),
  "ja-JP": () => import("@nowly/locales/messages/account/ja-JP.json"),
  "ko-KR": () => import("@nowly/locales/messages/account/ko-KR.json"),
  "tr-TR": () => import("@nowly/locales/messages/account/tr-TR.json"),
  "ms-MY": () => import("@nowly/locales/messages/account/ms-MY.json"),
  "el-GR": () => import("@nowly/locales/messages/account/el-GR.json")
};

export default catalogs;