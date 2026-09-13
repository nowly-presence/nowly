import { PresenceList } from "@/features/presences/presence-list";
import type { CurrentActivity, ExtensionSettings, InstalledPresences } from "@/shared/types";
import type { FC, ReactElement } from "react";

type Props = {
  activity: CurrentActivity | null;
  entries: Array<[string, InstalledPresences[string]]>;
  isLoading: boolean;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  settings: ExtensionSettings;
  updates: Record<string, string>;
};

export const ActivityView: FC<Props> = ({
  activity,
  entries,
  isLoading,
  onOpenMarketplace,
  onRemove,
  onSchedule,
  onToggle,
  settings,
  updates,
}): ReactElement => (
  <PresenceList
      isLoading={isLoading}
      activeSlug={activity?.slug ?? null}
      displayMode={settings.presenceDisplayMode}
      entries={entries}
      onOpenMarketplace={onOpenMarketplace}
      onRemove={onRemove}
      onSchedule={onSchedule}
      onToggle={onToggle}
      separateActive={settings.separateActivePresence}
      showSchedule={settings.scheduleEnabled !== false}
      updates={updates}
    />
);
