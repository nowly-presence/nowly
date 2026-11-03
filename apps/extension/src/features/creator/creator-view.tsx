import { useMemo, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { createDraft } from "@nowly/presence-creator/creator-draft";
import { LOCALE_LONG_MAP } from "@/shared/locales";
import { urlMatchesPresence } from "@/shared/url-patterns";
import { CreatorHome } from "@/features/creator/creator-home";
import { EditLocaleProvider } from "@/features/creator/creator-locale-tabs";
import { CreatorWizard } from "@/features/creator/creator-wizard";
import { CreatorLoadingPublished } from "@/features/creator/creator-loading-published";
import { usePublishedPresenceLoader } from "@/features/creator/use-published-presence-loader";
import { useCreatorDrafts } from "@/features/creator/use-creator-drafts";
import { downloadJsonFile } from "@/lib/download-json-file";
import { buildCreatorDraftFile, creatorDraftFileName, parseCreatorDraftFile, type DraftFileError } from "@/shared/creator/creator-draft-file";
import { useToast } from "@/ui/toast";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";
import type { MessageKey } from "@/hooks/i18n-provider";

const IMPORT_ERRORS: Record<DraftFileError, MessageKey> = {
  TOO_LARGE: "creator.home.importLarge",
  INVALID_JSON: "creator.home.importInvalid",
  WRONG_FORMAT: "creator.home.importInvalid",
  UNSUPPORTED_VERSION: "creator.home.importInvalid",
  INVALID_DRAFT: "creator.home.importInvalid"
};

export const CreatorView = ({ presenceSlug }: {
  presenceSlug?: string;
}) => {
  const { state } = useExtensionState();
  const { locale, t } = useI18n();
  const { toast } = useToast();
  const { pop } = useNav();
  const { drafts, list, ready, save, remove } = useCreatorDrafts();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? drafts[activeId] : undefined;
  const takenSlugs = useMemo(() => new Set(state.catalog.items.map((item) => item.slug)), [state.catalog.items]);

  const published = usePublishedPresenceLoader({
    slug: presenceSlug,
    drafts,
    ready,
    save,
    onLoaded: setActiveId
  });
  const start = async () => {
    const host = state.tab.hostname;
    const supported = host ? state.catalog.items.some((item) => urlMatchesPresence(`https://${host}/`, item.url)) : true;
    const draft = createDraft(LOCALE_LONG_MAP[locale], supported ? undefined : (host ?? undefined));
    await save(draft);
    setActiveId(draft.id);
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

  if (active) {
    return (
      <EditLocaleProvider key={active.id}>
        <CreatorWizard initial={active} takenSlugs={takenSlugs} persist={save} onExit={() => setActiveId(null)} />
      </EditLocaleProvider>
    );
  }

  if (presenceSlug) return <CreatorLoadingPublished loader={published} onBack={pop} />;

  return <CreatorHome drafts={list} ready={ready} onBack={pop} onCreate={() => void start()} onOpen={setActiveId} onDelete={(id) => void remove(id)} onImport={(file) => void importDraft(file)} onExport={exportDraft} />;
};