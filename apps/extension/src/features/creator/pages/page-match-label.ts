import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import type { CreatorMatchMode, CreatorPage } from "@/shared/creator/creator-types";

export const MATCH_MODE_KEYS: Record<CreatorMatchMode, MessageKey> = {
  any: "creator.page.matchAny",
  equals: "creator.page.matchEquals",
  startsWith: "creator.page.matchStartsWith",
  contains: "creator.page.matchContains"
};

export const useMatchLabel = () => {
  const { t } = useI18n();
  return (page: CreatorPage): string => {
    const path = page.match.path.trim();

    if (page.match.mode === "any" || !path) return t("creator.page.matchAny");

    return `${t(MATCH_MODE_KEYS[page.match.mode])} ${path}`;
  };
};