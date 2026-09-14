import { PresenceDetailView } from "@/features/presences/presence-detail-view";
import { PresenceList } from "@/features/presences/presence-list";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, PresenceDisplayMode } from "@/shared/types";
import type { FC, ReactElement } from "react";
import { useEffect } from "react";

type Props = {
  activity: CurrentActivity | null;
  entries: Array<[string, InstalledPresences[string]]>;
  isLoading: boolean;
  onOpenWebsite: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onSelectPresence: (slug: string | null) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  onUpdatePresence: (slug: string) => void;
  selectedSlug: string | null;
  settings: ExtensionSettings;
  updates: Record<string, string>;
  updatingSlug?: string | null;
};

const resolveDisplayMode = (mode: ExtensionSettings["presenceDisplayMode"]): PresenceDisplayMode =>
  mode === "grid" ? "grid" : "category";

export const ActivityView: FC<Props> = ({
  activity,
  entries,
  isLoading,
  onOpenWebsite,
  onRemove,
  onSchedule,
  onSelectPresence,
  onToggle,
  onUpdatePresence,
  selectedSlug,
  settings,
  updates,
  updatingSlug,
}): ReactElement => {
  const displayMode = resolveDisplayMode(settings.presenceDisplayMode);
  const selected = selectedSlug ? entries.find(([slug]) => slug === selectedSlug) : undefined;

  useEffect(() => {
    if (!selectedSlug || isLoading) return;
    if (!selected) onSelectPresence(null);
  }, [isLoading, onSelectPresence, selected, selectedSlug]);

  if (selected) {
    const [slug, presence] = selected;
    return (
      <PresenceDetailView
        slug={slug}
        presence={presence}
        onBack={() => onSelectPresence(null)}
        onOpenWebsite={onOpenWebsite}
        onRemove={(nextSlug) => {
          onRemove(nextSlug);
          onSelectPresence(null);
        }}
        onSchedule={settings.scheduleEnabled !== false ? onSchedule : undefined}
        onToggle={onToggle}
        onUpdatePresence={onUpdatePresence}
        updateAvailable={updates[slug]}
        updating={updatingSlug === slug}
      />
    );
  }

  return (
    <PresenceList
      isLoading={isLoading}
      activeSlug={activity?.slug ?? null}
      displayMode={displayMode}
      entries={entries}
      onOpen={onSelectPresence}
      onSchedule={onSchedule}
      onToggle={onToggle}
      onUpdatePresence={onUpdatePresence}
      separateActive={settings.separateActivePresence}
      showSchedule={settings.scheduleEnabled !== false}
      updates={updates}
      updatingSlug={updatingSlug}
    />
  );
};
