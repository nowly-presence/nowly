import type { MessageLoader } from "@nowly/locales/messages";
import type { LocaleString } from "@nowly/locales";

const catalogs: Record<LocaleString, MessageLoader> = {
  "en-US": () => import("@nowly/locales/messages/shared/en-US.json"),
  "fr-FR": () => import("@nowly/locales/messages/shared/fr-FR.json"),
  "es-ES": () => import("@nowly/locales/messages/shared/es-ES.json"),
  "de-DE": () => import("@nowly/locales/messages/shared/de-DE.json"),
  "pt-BR": () => import("@nowly/locales/messages/shared/pt-BR.json"),
  "pl-PL": () => import("@nowly/locales/messages/shared/pl-PL.json"),
  "ja-JP": () => import("@nowly/locales/messages/shared/ja-JP.json"),
  "ko-KR": () => import("@nowly/locales/messages/shared/ko-KR.json"),
  "tr-TR": () => import("@nowly/locales/messages/shared/tr-TR.json"),
  "ms-MY": () => import("@nowly/locales/messages/shared/ms-MY.json"),
  "el-GR": () => import("@nowly/locales/messages/shared/el-GR.json")
};

export default catalogs;