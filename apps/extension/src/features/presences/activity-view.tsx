import { PresenceDetailView } from "@/features/presences/presence-detail-view";
import { PresenceList } from "@/features/presences/presence-list";
import type { CurrentActivity, ExtensionSettings, InstalledPresences, PresenceDisplayMode } from "@/shared/types";
import type { FC, ReactElement } from "react";
import { useEffect } from "react";

type Props = {
  activity: CurrentActivity | null;
  entries: Array<[string, InstalledPresences[string]]>;
  isLoading: boolean;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onSelectPresence: (slug: string | null) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  selectedSlug: string | null;
  settings: ExtensionSettings;
  updates: Record<string, string>;
};

const resolveDisplayMode = (mode: ExtensionSettings["presenceDisplayMode"]): PresenceDisplayMode =>
  mode === "grid" ? "grid" : "category";

export const ActivityView: FC<Props> = ({
  activity,
  entries,
  isLoading,
  onOpenMarketplace,
  onRemove,
  onSchedule,
  onSelectPresence,
  onToggle,
  selectedSlug,
  settings,
  updates,
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
        onOpenMarketplace={onOpenMarketplace}
        onRemove={(nextSlug) => {
          onRemove(nextSlug);
          onSelectPresence(null);
        }}
        onSchedule={settings.scheduleEnabled !== false ? onSchedule : undefined}
        onToggle={onToggle}
        updateAvailable={updates[slug]}
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
      onOpenMarketplace={onOpenMarketplace}
      onSchedule={onSchedule}
      onToggle={onToggle}
      separateActive={settings.separateActivePresence}
      showSchedule={settings.scheduleEnabled !== false}
      updates={updates}
    />
  );
};
