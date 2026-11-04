import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import { downloadJsonFile } from "@/lib/download-json-file";
import { buildCreatorDraftFile, creatorDraftFileName, parseCreatorDraftFile, type DraftFileError } from "@/shared/creator/creator-draft-file";
import { LOCALE_LONG_MAP } from "@/shared/locales";
import { urlMatchesPresence } from "@/shared/url-patterns";
import { useToast } from "@/ui/toast";
import { createDraft } from "@nowly/presence-creator/creator-draft";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

const IMPORT_ERRORS: Record<DraftFileError, MessageKey> = {
  TOO_LARGE: "creator.home.importLarge",
  INVALID_JSON: "creator.home.importInvalid",
  WRONG_FORMAT: "creator.home.importInvalid",
  UNSUPPORTED_VERSION: "creator.home.importInvalid",
  INVALID_DRAFT: "creator.home.importInvalid"
};

export const useCreatorHomeActions = (save: (draft: CreatorDraft) => Promise<void>) => {
  const { state } = useExtensionState();
  const { locale, t } = useI18n();
  const { toast } = useToast();

  const start = async (): Promise<string> => {
    const host = state.tab.hostname;
    const supported = host ? state.catalog.items.some((item) => urlMatchesPresence(`https://${host}/`, item.url)) : true;
    const draft = createDraft(LOCALE_LONG_MAP[locale], supported ? undefined : (host ?? undefined));
    await save(draft);
    return draft.id;
  };

  const exportDraft = (draft: CreatorDraft) => {
    downloadJsonFile(creatorDraftFileName(draft.name), buildCreatorDraftFile(draft));
    toast(t("creator.home.exported"));
  };

  const importDraft = async (file: File) => {
    try {
      const result = parseCreatorDraftFile(await file.text());

      if (!result.ok) {
        toast(t(IMPORT_ERRORS[result.error]), "error");
        return;
      }

      await save(result.draft);
      toast(t("creator.home.imported"));
    } catch {
      toast(t("error.generic"), "error");
    }
  };

  return { start, exportDraft, importDraft };
};
