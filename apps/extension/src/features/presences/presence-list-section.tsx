import type { FC } from "react";
import { PresenceListItem } from "@/features/presences/presence-list-item";
import type { PresenceListEntry } from "@/features/presences/presence-list.model";

type Props = {
  entries: PresenceListEntry[];
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  showSchedule: boolean;
  updates: Record<string, string>;
};

export const PresenceListSection: FC<Props> = ({
  entries,
  onOpenMarketplace,
  onRemove,
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
        onToggle={onToggle}
        onRemove={onRemove}
        onSchedule={onSchedule}
        onOpenMarketplace={onOpenMarketplace}
        updateAvailable={updates[slug]}
      />
    ))}
  </div>
);