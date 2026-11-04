import { useEffect, useMemo, useState } from "react";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useNav } from "@/hooks/navigation-provider";
import { EditLocaleProvider } from "@/features/creator/creator-locale-tabs";
import { CreatorWizard } from "@/features/creator/creator-wizard";
import { CreatorLoadingPublished } from "@/features/creator/creator-loading-published";
import { usePublishedPresenceLoader } from "@/features/creator/use-published-presence-loader";
import { useCreatorDrafts } from "@/features/creator/use-creator-drafts";
import { Skeleton } from "@/ui/skeleton";

export const CreatorView = ({ presenceSlug, draftId }: {
  presenceSlug?: string;
  draftId?: string;
}) => {
  const { state } = useExtensionState();
  const { pop } = useNav();
  const { drafts, ready, save } = useCreatorDrafts();
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const takenSlugs = useMemo(() => new Set(state.catalog.items.map((item) => item.slug)), [state.catalog.items]);
  const published = usePublishedPresenceLoader({
    slug: presenceSlug,
    drafts,
    ready,
    save,
    onLoaded: setLoadedId
  });
  const targetId = draftId ?? loadedId;
  const active = targetId ? drafts[targetId] : undefined;
  const missing = ready && !presenceSlug && !active;

  useEffect(() => {
    if (missing) pop();
  }, [missing, pop]);

  if (active) {
    return (
      <EditLocaleProvider key={active.id}>
        <CreatorWizard initial={active} takenSlugs={takenSlugs} persist={save} onExit={pop} />
      </EditLocaleProvider>
    );
  }

  if (presenceSlug) return <CreatorLoadingPublished loader={published} onBack={pop} />;

  return <Skeleton className="m-4 h-24" />;
};
