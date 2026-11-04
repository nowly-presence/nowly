import { useEffect, useRef } from "react";
import { sendMessage } from "@/lib/messages";
import { useNav } from "@/hooks/navigation-provider";
import { CreatorHome } from "@/features/creator/creator-home";
import { useCreatorDrafts } from "@/features/creator/use-creator-drafts";
import { useCreatorHomeActions } from "@/features/creator/use-creator-home-actions";

export const CreatorTab = () => {
  const { push } = useNav();
  const { list, ready, save, remove } = useCreatorDrafts();
  const { start, importDraft, exportDraft } = useCreatorHomeActions(save);
  const latestList = useRef(list);
  latestList.current = list;
  const pendingIds = list.flatMap((draft) => (draft.submission ? [draft.submission.id] : [])).join(",");

  useEffect(() => {
    if (!ready || !pendingIds) return;

    const refresh = async () => {
      const latest = await sendMessage("CREATOR_FETCH_SUBMISSIONS", { ids: pendingIds.split(",") });

      for (const submission of latest) {
        const draft = latestList.current.find((entry) => entry.submission?.id === submission.id);

        if (draft?.submission && JSON.stringify(draft.submission) !== JSON.stringify(submission)) await save({ ...draft, submission });
      }
    };

    void refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [ready, pendingIds]);

  const open = (draftId: string) =>
    push({
      name: "creator",
      draftId
    });

  return <CreatorHome drafts={list} ready={ready} onCreate={() => void start().then(open)} onOpen={open} onDelete={(id) => void remove(id)} onImport={(file) => void importDraft(file)} onExport={exportDraft} />;
};
