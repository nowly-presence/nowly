import { useNav } from "@/hooks/navigation-provider";
import { CreatorHome } from "@/features/creator/creator-home";
import { useCreatorDrafts } from "@/features/creator/use-creator-drafts";
import { useCreatorHomeActions } from "@/features/creator/use-creator-home-actions";

export const CreatorTab = () => {
  const { push } = useNav();
  const { list, ready, save, remove } = useCreatorDrafts();
  const { start, importDraft, exportDraft } = useCreatorHomeActions(save);
  const open = (draftId: string) =>
    push({
      name: "creator",
      draftId
    });

  return <CreatorHome drafts={list} ready={ready} onCreate={() => void start().then(open)} onOpen={open} onDelete={(id) => void remove(id)} onImport={(file) => void importDraft(file)} onExport={exportDraft} />;
};
