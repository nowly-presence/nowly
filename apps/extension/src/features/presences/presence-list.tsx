import { Input } from "@/components/ui/input";
import { t } from "@/shared/i18n";
import type { PresenceDisplayMode } from "@/shared/types";
import type { FC, ReactElement } from "react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/features/presences/empty-state";
import { PresenceGridSection } from "@/features/presences/presence-grid-section";
import { PresenceListSection } from "@/features/presences/presence-list-section";
import { PresenceListSkeleton } from "@/features/presences/presence-list-skeleton";
import {
  getCategoryLabel,
  groupByCategory,
  matchesPresenceSearch,
  type PresenceListEntry,
} from "@/features/presences/presence-list.model";

type Props = {
  activeSlug: string | null;
  displayMode: PresenceDisplayMode;
  entries: PresenceListEntry[];
  isLoading: boolean;
  onOpen: (slug: string) => void;
  onSchedule: (slug: string) => void;
  onToggle: (slug: string, enabled: boolean) => void;
  onUpdatePresence: (slug: string) => void;
  separateActive: boolean;
  showSchedule: boolean;
  updates: Record<string, string>;
  updatingSlug?: string | null;
};

type SectionProps = Pick<
  Props,
  "onOpen" | "onUpdatePresence" | "onSchedule" | "onToggle" | "showSchedule" | "updates" | "updatingSlug"
> & {
  entries: PresenceListEntry[];
  layout: "list" | "grid";
};

const PresenceEntries: FC<SectionProps> = ({
  entries,
  layout,
  onOpen,
  onUpdatePresence,
  onSchedule,
  onToggle,
  showSchedule,
  updates,
  updatingSlug,
}): ReactElement =>
  layout === "grid" ? (
    <PresenceGridSection entries={entries} onOpen={onOpen} updates={updates} />
  ) : (
    <PresenceListSection
      entries={entries}
      onOpen={onOpen}
      onUpdatePresence={onUpdatePresence}
      onSchedule={onSchedule}
      onToggle={onToggle}
      showSchedule={showSchedule}
      updates={updates}
      updatingSlug={updatingSlug}
    />
  );

const searchInputClassName =
  "h-9 w-full appearance-none rounded-xl border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-dim-foreground hover:bg-card-hover focus:border-border-light focus:bg-card-2";

export const PresenceList: FC<Props> = ({
  activeSlug,
  displayMode,
  entries,
  isLoading,
  onOpen,
  onSchedule,
  onToggle,
  onUpdatePresence,
  separateActive,
  showSchedule,
  updates,
  updatingSlug,
}) => {
  const [query, setQuery] = useState("");

  const scoped = useMemo(
    () => (separateActive && activeSlug ? entries.filter(([slug]) => slug !== activeSlug) : entries),
    [activeSlug, entries, separateActive],
  );

  const filtered = useMemo(
    () => scoped.filter(([slug, presence]) => matchesPresenceSearch(slug, presence, query)),
    [query, scoped],
  );

  if (isLoading) {
    return (
      <PresenceListSkeleton displayMode={displayMode} />
    );
  }

  if (scoped.length === 0) return <EmptyState />;

  const sectionProps = {
    onOpen,
    onUpdatePresence,
    onSchedule,
    onToggle,
    showSchedule,
    updates,
    updatingSlug,
  };
  const layout = displayMode === "grid" ? "grid" : "list";
  const groups = groupByCategory(filtered);

  return (
    <div className="flex flex-col gap-4">
      <Input
        unstyled
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("home-search")}
        aria-label={t("home-search")}
        className={searchInputClassName}
      />

      {filtered.length === 0 ? (
        <EmptyState description={t("home-search-empty")} title={t("home-search-empty-title")} />
      ) : (
        groups.map(([category, categoryEntries]) => {
          const enabled = categoryEntries.filter(([, presence]) => presence.enabled);
          const disabled = categoryEntries.filter(([, presence]) => !presence.enabled);
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
        })
      )}
    </div>
  );
};
