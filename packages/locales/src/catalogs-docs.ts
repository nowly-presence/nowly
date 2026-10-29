import type { MessageLoader } from "@nowly/locales/messages";
import type { LocaleString } from "@nowly/locales";

const catalogs: Record<LocaleString, MessageLoader> = {
  "en-US": () => import("@nowly/locales/messages/docs/en-US.json"),
  "fr-FR": () => import("@nowly/locales/messages/docs/fr-FR.json"),
  "es-ES": () => import("@nowly/locales/messages/docs/es-ES.json"),
  "de-DE": () => import("@nowly/locales/messages/docs/de-DE.json"),
  "pt-BR": () => import("@nowly/locales/messages/docs/pt-BR.json"),
  "pl-PL": () => import("@nowly/locales/messages/docs/pl-PL.json"),
  "ja-JP": () => import("@nowly/locales/messages/docs/ja-JP.json"),
  "ko-KR": () => import("@nowly/locales/messages/docs/ko-KR.json"),
  "tr-TR": () => import("@nowly/locales/messages/docs/tr-TR.json"),
  "ms-MY": () => import("@nowly/locales/messages/docs/ms-MY.json"),
  "el-GR": () => import("@nowly/locales/messages/docs/el-GR.json")
};

export default catalogs;