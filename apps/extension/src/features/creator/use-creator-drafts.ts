import { useCallback, useEffect, useMemo, useState } from "react";
import { CREATOR_DRAFTS_KEY, deleteDraft, loadDrafts, saveDraft, sortedDrafts, type CreatorDrafts } from "@/shared/creator/creator-storage";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

export const useCreatorDrafts = () => {
  const [drafts, setDrafts] = useState<CreatorDrafts>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void loadDrafts().then((value) => {
      setDrafts(value);
      setReady(true);
    });
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "local" && CREATOR_DRAFTS_KEY in changes) void loadDrafts().then(setDrafts);
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  const save = useCallback(async (draft: CreatorDraft) => {
    setDrafts((current) => ({
      ...current,
      [draft.id]: draft
    }));
    await saveDraft(draft);
  }, []);

  const remove = useCallback(async (id: string) => {
    setDrafts(({ [id]: _removed, ...rest }) => rest);
    await deleteDraft(id);
  }, []);

  const list = useMemo(() => sortedDrafts(drafts), [drafts]);

  return { drafts, list, ready, save, remove };
};