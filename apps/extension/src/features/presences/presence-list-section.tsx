import type { FC } from "react";
import { PresenceListItem } from "@/features/presences/presence-list-item";
import type { PresenceListEntry } from "@/features/presences/presence-list.model";

type Props = {
  entries: PresenceListEntry[];
  onOpen: (slug: string) => void;
  onUpdatePresence: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  showSchedule: boolean;
  updates: Record<string, string>;
  updatingSlug?: string | null;
};

export const PresenceListSection: FC<Props> = ({
  entries,
  onOpen,
  onUpdatePresence,
  onSchedule,
  onToggle,
  showSchedule,
  updates,
  updatingSlug,
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
        onUpdatePresence={onUpdatePresence}
        updateAvailable={updates[slug]}
        updating={updatingSlug === slug}
      />
    ))}
  </div>
);
