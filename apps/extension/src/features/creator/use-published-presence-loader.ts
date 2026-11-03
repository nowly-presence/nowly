import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessage } from "@/lib/messages";
import type { AdminError } from "@/shared/admin/admin-types";
import type { CreatorDrafts } from "@/shared/creator/creator-storage";
import type { CreatorDraft } from "@nowly/presence-creator/creator-types";

export type PublishedPresenceLoader = {
  error: AdminError | null;
  retry: () => void;
};

export const usePublishedPresenceLoader = ({ slug, drafts, ready, save, onLoaded }: {
  slug: string | undefined;
  drafts: CreatorDrafts;
  ready: boolean;
  save: (draft: CreatorDraft) => Promise<void>;
  onLoaded: (id: string) => void;
}): PublishedPresenceLoader => {
  const [error, setError] = useState<AdminError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(-1);
  const current = useRef({ drafts, save, onLoaded });
  current.current = { drafts, save, onLoaded };

  useEffect(() => {
    if (!slug || !ready || started.current === attempt) return;

    started.current = attempt;
    setError(null);
    void sendMessage("ADMIN_LOAD_CREATOR_PRESENCE", { slug }).then(async (result) => {
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const { drafts: known, save: persist, onLoaded: open } = current.current;
      const existing = known[result.data.id];

      if (existing && existing.submission?.status !== "published") {
        open(existing.id);
        return;
      }

      await persist(result.data);
      open(result.data.id);
    });
  }, [slug, ready, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { error, retry };
};