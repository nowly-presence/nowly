import { t } from "@/shared/i18n";
import type { PresenceDisplayMode } from "@/shared/types";
import type { FC, ReactElement } from "react";
import { EmptyState } from "@/features/presences/empty-state";
import { PresenceGridSection } from "@/features/presences/presence-grid-section";
import { PresenceListSection } from "@/features/presences/presence-list-section";
import { PresenceListSkeleton } from "@/features/presences/presence-list-skeleton";
import { getCategoryLabel, groupByCategory, type PresenceListEntry } from "@/features/presences/presence-list.model";

type Props = {
  activeSlug: string | null;
  displayMode: PresenceDisplayMode;
  entries: PresenceListEntry[];
  isLoading: boolean;
  onOpen: (slug: string) => void;
  onOpenMarketplace: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  separateActive: boolean;
  showSchedule: boolean;
  updates: Record<string, string>;
};

type SectionProps = Pick<
  Props,
  "onOpen" | "onOpenMarketplace" | "onSchedule" | "onToggle" | "showSchedule" | "updates"
> & {
  entries: PresenceListEntry[];
  layout: "list" | "grid";
};

const PresenceEntries: FC<SectionProps> = ({
  entries,
  layout,
  onOpen,
  onOpenMarketplace,
  onSchedule,
  onToggle,
  showSchedule,
  updates,
}): ReactElement =>
  layout === "grid" ? (
    <PresenceGridSection entries={entries} onOpen={onOpen} updates={updates} />
  ) : (
    <PresenceListSection
      entries={entries}
      onOpen={onOpen}
      onOpenMarketplace={onOpenMarketplace}
      onSchedule={onSchedule}
      onToggle={onToggle}
      showSchedule={showSchedule}
      updates={updates}
    />
  );

export const PresenceList: FC<Props> = ({
  activeSlug,
  displayMode,
  entries,
  isLoading,
  onOpen,
  onOpenMarketplace,
  onSchedule,
  onToggle,
  separateActive,
  showSchedule,
  updates,
}) => {
  if (isLoading) {
    return (
      <PresenceListSkeleton displayMode={displayMode} />
    );
  }

  const filtered = separateActive && activeSlug
    ? entries.filter(([slug]) => slug !== activeSlug)
    : entries;

  if (filtered.length === 0) return <EmptyState />;

  const sectionProps = {
    onOpen,
    onOpenMarketplace,
    onSchedule,
    onToggle,
    showSchedule,
    updates,
  };
  const layout = displayMode === "grid" ? "grid" : "list";
  const groups = groupByCategory(filtered);

  return (
    <div className="flex flex-col gap-4">
      {groups.map(([category, categoryEntries]) => {
        const enabled = categoryEntries.filter(([, p]) => p.enabled);
        const disabled = categoryEntries.filter(([, p]) => !p.enabled);
        const total = categoryEntries.length;
        const activeCount = enabled.length;
        const countLabel =
          activeCount === 0
            ? t("category-count-none")
            : activeCount === total
              ? t("category-count-all")
              : t("category-count-some", { count: String(activeCount), total: String(total) });

        return (
          <section key={category} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 truncate text-base font-semibold text-foreground">
                {getCategoryLabel(category)}
              </h2>
              <span className="shrink-0 rounded-md bg-card-2 px-2 py-0.5 text-xs text-muted-foreground">
                {countLabel}
              </span>
            </div>

            <PresenceEntries
              layout={layout}
              entries={[...enabled, ...disabled]}
              {...sectionProps}
            />
          </section>
        );
      })}
    </div>
  );
};
