import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StoreCard } from "@/features/store/store-card";
import { StoreDetail } from "@/features/store/store-detail";
import { StoreSkeleton } from "@/features/store/store-skeleton";
import {
  catalogCategories,
  filterStorePresences,
  storeCategoryLabel,
  type StorePresence,
} from "@/features/store/store.model";
import { usePresenceCatalog } from "@/features/store/use-presence-catalog";
import { t } from "@/shared/i18n";
import type { InstalledPresences } from "@/shared/types";
import type { PresenceCategory } from "@/features/presences/presence-list.model";
import type { FC, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

type Props = {
  installingSlug: string | null;
  onInstall: (slug: string) => void;
  presences: InstalledPresences;
  seedQuery?: string;
  seedSlug?: string | null;
  updates: Record<string, string>;
};

const storeAction = (
  slug: string,
  presences: InstalledPresences,
  updates: Record<string, string>,
): "install" | "update" | "installed" => {
  if (!presences[slug]) return "install";
  return updates[slug] ? "update" : "installed";
};

export const StoreView: FC<Props> = ({
  installingSlug,
  onInstall,
  presences,
  seedQuery = "",
  seedSlug = null,
  updates,
}): ReactElement => {
  const { items, isError, isLoading, refetch } = usePresenceCatalog();
  const [query, setQuery] = useState(seedQuery);
  const [category, setCategory] = useState<PresenceCategory | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(seedSlug);

  useEffect(() => {
    setQuery(seedQuery);
    setSelectedSlug(seedSlug);
  }, [seedQuery, seedSlug]);

  const categories = useMemo(() => catalogCategories(items), [items]);
  const filtered = useMemo(
    () => filterStorePresences(items, query, category),
    [category, items, query],
  );

  const selected = selectedSlug
    ? items.find((item) => item.slug === selectedSlug) ?? null
    : null;

  if (isLoading) return <StoreSkeleton />;

  if (isError) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold">{t("store-error")}</p>
        <div className="mt-4 flex justify-center">
          <Button size="sm" onClick={() => void refetch()}>{t("store-retry")}</Button>
        </div>
      </section>
    );
  }

  if (selected) {
    return (
      <StoreDetail
        action={storeAction(selected.slug, presences, updates)}
        installing={installingSlug === selected.slug}
        onBack={() => setSelectedSlug(null)}
        onInstall={onInstall}
        presence={selected}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        unstyled
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("store-search")}
        aria-label={t("store-search")}
        className="h-9 w-full appearance-none rounded-xl border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-dim-foreground hover:bg-card-hover focus:border-border-light focus:bg-card-2"
      />

      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          <CategoryChip
            active={category === null}
            label={t("store-all-categories")}
            onSelect={() => setCategory(null)}
          />
          {categories.map((item) => (
            <CategoryChip
              key={item}
              active={category === item}
              label={storeCategoryLabel(item)}
              onSelect={() => setCategory(item)}
            />
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <section className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <p className="text-sm font-semibold">{t("store-empty")}</p>
        </section>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {filtered.map((presence: StorePresence) => (
            <StoreCard
              key={presence.slug}
              action={storeAction(presence.slug, presences, updates)}
              installing={installingSlug === presence.slug}
              onInstall={onInstall}
              onOpen={setSelectedSlug}
              presence={presence}
            />
          ))}
        </div>
      )}
    </div>
  );
};

type ChipProps = {
  active: boolean;
  label: string;
  onSelect: () => void;
};

const CategoryChip: FC<ChipProps> = ({ active, label, onSelect }): ReactElement => (
  <Button
    variant="unstyled"
    size="none"
    onClick={onSelect}
    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-accent/15 text-accent"
        : "bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
    }`}
  >
    {label}
  </Button>
);
