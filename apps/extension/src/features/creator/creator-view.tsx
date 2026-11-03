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
import { useCreatorDrafts } from "@/features/creator/use-creator-drafts";

export const CreatorView = () => {
  const { state } = useExtensionState();
  const { locale } = useI18n();
  const { pop } = useNav();
  const { drafts, list, ready, save, remove } = useCreatorDrafts();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = activeId ? drafts[activeId] : undefined;
  const takenSlugs = useMemo(() => new Set(state.catalog.items.map((item) => item.slug)), [state.catalog.items]);

  const start = async () => {
    const host = state.tab.hostname;
    const supported = host ? state.catalog.items.some((item) => urlMatchesPresence(`https://${host}/`, item.url)) : true;
    const draft = createDraft(LOCALE_LONG_MAP[locale], supported ? undefined : (host ?? undefined));
    await save(draft);
    setActiveId(draft.id);
  };

  if (active) {
    return (
      <EditLocaleProvider key={active.id}>
        <CreatorWizard initial={active} takenSlugs={takenSlugs} persist={save} onExit={() => setActiveId(null)} />
      </EditLocaleProvider>
    );
  }

  return <CreatorHome drafts={list} ready={ready} onBack={pop} onCreate={() => void start()} onOpen={setActiveId} onDelete={(id) => void remove(id)} />;
};