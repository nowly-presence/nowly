import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { touch } from "@nowly/presence-creator/creator-draft";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

const AUTOSAVE_DELAY_MS = 500;

export type DraftUpdate = (update: Partial<CreatorDraft> | ((draft: CreatorDraft) => CreatorDraft)) => void;

export const useDraftEditor = (initial: CreatorDraft, persist: (draft: CreatorDraft) => Promise<void>) => {
  const [draft, setDraft] = useState(initial);
  const latest = useRef(initial);
  const dirty = useRef(false);
  const persistLater = useDebouncedCallback((next: CreatorDraft) => {
    dirty.current = false;
    void persist(next);
  }, AUTOSAVE_DELAY_MS);

  useEffect(() => () => {
    if (dirty.current) void persist(latest.current);
  }, [persist]);

  const update = useCallback<DraftUpdate>((change) => {
    setDraft((current) => {
      const next = touch(typeof change === "function" ? change(current) : { ...current, ...change });
      latest.current = next;
      dirty.current = true;
      persistLater(next);
      return next;
    });
  }, [persistLater]);

  return { draft, update };
};