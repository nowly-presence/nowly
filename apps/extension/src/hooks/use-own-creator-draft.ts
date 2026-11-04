import { useEffect, useState } from "react";
import { presenceSlug } from "@nowly/presence-creator/creator-draft";
import { loadDrafts } from "@/shared/creator/creator-storage";

export const useOwnCreatorDraft = (slug: string): string | null => {
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDrafts().then((drafts) => {
      const own = Object.values(drafts).find((draft) => draft.submission?.status === "published" && presenceSlug(draft.name) === slug);
      if (!cancelled) setDraftId(own?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return draftId;
};