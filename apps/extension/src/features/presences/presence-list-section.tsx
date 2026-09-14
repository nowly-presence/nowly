import type { FC } from "react";
import { PresenceListItem } from "@/features/presences/presence-list-item";
import type { PresenceListEntry } from "@/features/presences/presence-list.model";

type Props = {
  entries: PresenceListEntry[];
  onOpen: (slug: string) => void;
  onOpenMarketplace: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  showSchedule: boolean;
  updates: Record<string, string>;
};

export const PresenceListSection: FC<Props> = ({
  entries,
  onOpen,
  onOpenMarketplace,
  onSchedule,
  onToggle,
  showSchedule,
  updates,
}) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card">
    {entries.map(([slug, presence]) => (
      <PresenceListItem
        key={slug}
        slug={slug}
        presence={presence}
        showSchedule={showSchedule}
        onOpen={onOpen}
        onToggle={onToggle}
        onSchedule={onSchedule}
        onOpenMarketplace={onOpenMarketplace}
        updateAvailable={updates[slug]}
      />
    ))}
  </div>
);
