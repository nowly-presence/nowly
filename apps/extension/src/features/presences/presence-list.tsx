import { t } from "@/shared/i18n";
import type { PresenceDisplayMode } from "@/shared/types";
import type { FC } from "react";
import { EmptyState } from "@/features/presences/empty-state";
import { PresenceListSection } from "@/features/presences/presence-list-section";
import { PresenceListSkeleton } from "@/features/presences/presence-list-skeleton";
import { getCategoryLabel, groupByCategory, sortAlphabetically, type PresenceListEntry } from "@/features/presences/presence-list.model";

type Props = {
  activeSlug: string | null;
  displayMode: PresenceDisplayMode;
  entries: PresenceListEntry[];
  isLoading: boolean;
  onOpenMarketplace: (slug: string) => void;
  onRemove: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  separateActive: boolean;
  showSchedule: boolean;
  updates: Record<string, string>;
};

export const PresenceList: FC<Props> = ({
  activeSlug,
  displayMode,
  entries,
  isLoading,
  onOpenMarketplace,
  onRemove,
  onSchedule,
  onToggle,
  separateActive,
  showSchedule,
  updates,
}) => {
  if (isLoading) return <PresenceListSkeleton />;

  const filtered = separateActive && activeSlug
    ? entries.filter(([slug]) => slug !== activeSlug)
    : entries;

  if (filtered.length === 0) return <EmptyState />;

  const disabledEntries = filtered.filter(([, p]) => !p.enabled);
  const hasDisabled = disabledEntries.length > 0;

  if (displayMode === "alphabetical") {
    const activeSorted = sortAlphabetically(filtered.filter(([, p]) => p.enabled));

    if (!hasDisabled) {
      return (
        <PresenceListSection
          entries={activeSorted}
          onOpenMarketplace={onOpenMarketplace}
          onRemove={onRemove}
          onSchedule={onSchedule}
          onToggle={onToggle}
          showSchedule={showSchedule}
          updates={updates}
        />
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-muted-foreground">
            {t("active-presences")}
          </h2>
          <PresenceListSection
            entries={activeSorted}
            onOpenMarketplace={onOpenMarketplace}
            onRemove={onRemove}
            onSchedule={onSchedule}
            onToggle={onToggle}
            showSchedule={showSchedule}
            updates={updates}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-muted-foreground">
            {t("disabled-presences")}
          </h2>
          <PresenceListSection
            entries={sortAlphabetically(disabledEntries)}
            onOpenMarketplace={onOpenMarketplace}
            onRemove={onRemove}
            onSchedule={onSchedule}
            onToggle={onToggle}
            showSchedule={showSchedule}
            updates={updates}
          />
        </section>
      </div>
    );
  }

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

              <PresenceListSection
                entries={[...enabled, ...disabled]}
                onOpenMarketplace={onOpenMarketplace}
                onRemove={onRemove}
                onSchedule={onSchedule}
                onToggle={onToggle}
                showSchedule={showSchedule}
                updates={updates}
              />
            </section>
          );
        })}
    </div>
  );
};