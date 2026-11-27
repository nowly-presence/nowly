import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { matchPaths } from "@nowly/presence-creator/creator-activity";
import type { CreatorMatchMode, CreatorPage } from "@nowly/presence-creator/creator-types";

export const MATCH_MODE_KEYS: Record<CreatorMatchMode, MessageKey> = {
  any: "creator.page.matchAny",
  equals: "creator.page.matchEquals",
  startsWith: "creator.page.matchStartsWith",
  contains: "creator.page.matchContains"
};

export const useMatchLabel = () => {
  const { t } = useI18n();
  return (page: CreatorPage): string => {
    const paths = matchPaths(page);

    if (paths.length === 0) return t("creator.page.matchAny");

    return `${t(MATCH_MODE_KEYS[page.match.mode])} ${paths.join(", ")}`;
  };
};