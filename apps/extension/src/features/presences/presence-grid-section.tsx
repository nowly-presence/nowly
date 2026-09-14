import type { FC } from "react";
import { PresenceGridCard } from "@/features/presences/presence-grid-card";
import type { PresenceListEntry } from "@/features/presences/presence-list.model";

type Props = {
  entries: PresenceListEntry[];
  onOpen: (slug: string) => void;
  updates: Record<string, string>;
};

export const PresenceGridSection: FC<Props> = ({
  entries,
  onOpen,
  updates,
}) => (
  <div className="grid grid-cols-2 gap-2">
    {entries.map(([slug, presence]) => (
      <PresenceGridCard
        key={slug}
        slug={slug}
        presence={presence}
        onOpen={onOpen}
        updateAvailable={updates[slug]}
      />
    ))}
  </div>
);
