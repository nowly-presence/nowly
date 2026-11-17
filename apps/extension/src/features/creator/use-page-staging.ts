import { useCallback, useState } from "react";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";
import type { DraftUpdate } from "@/features/creator/use-draft-editor";

type PageStagingOptions = {
  saved: CreatorDraft;
  commit: DraftUpdate;
  editing: boolean;
};

export const usePageStaging = ({ saved, commit, editing }: PageStagingOptions) => {
  const [staged, setStaged] = useState<CreatorDraft | null>(null);
  const draft = editing && staged ? staged : saved;
  const dirty = editing && staged !== null && JSON.stringify(staged.pages) !== JSON.stringify(saved.pages);

  const update = useCallback<DraftUpdate>((change) => {
    if (!editing) {
      commit(change);
      return;
    }

    setStaged((current) => {
      const base = current ?? saved;
      return typeof change === "function" ? change(base) : { ...base, ...change };
    });
  }, [commit, editing, saved]);

  const save = useCallback(() => {
    if (staged) commit(staged);
    setStaged(null);
  }, [commit, staged]);

  const discard = useCallback(() => setStaged(null), []);

  return { draft, update, dirty, save, discard };
};