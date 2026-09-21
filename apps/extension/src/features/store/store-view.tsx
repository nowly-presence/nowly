import { RiSearchLine } from "@remixicon/react"
import { useEffect, useMemo, useState } from "react"
import { InstallQueueBanner } from "@/features/store/install-queue-banner"
import { StoreCard } from "@/features/store/store-card"
import { StoreDetail } from "@/features/store/store-detail"
import { catalogCategories, filterStorePresences, storeCategoryLabel, type StorePresence } from "@/features/store/store.model"
import { usePresenceCatalog } from "@/features/store/use-presence-catalog"
import type { PresenceCategory } from "@/features/activity/presence-list.model"
import { t } from "@/shared/i18n"
import type { InstalledPresences } from "@/shared/types"
import { Button } from "@/ui/button"
import { Empty, EmptyDescription, EmptyTitle } from "@/ui/empty"
import { Input } from "@/ui/input"
import { Skeleton } from "@/ui/skeleton"
import { cn } from "@/ui/utils"

type Props = {
  installingSlug: string | null
  installQueueCount: number
  onInstall: (slug: string) => void
  onOpenInstalled: (slug: string) => void
  onOpenWebsite: (slug: string) => void
  onRetryQueue: () => void
  onSelectPresence: (slug: string | null) => void
  presences: InstalledPresences
  seedQuery?: string
  selectedSlug: string | null
  updates: Record<string, string>
}

const storeAction = (slug: string, presences: InstalledPresences, updates: Record<string, string>): "install" | "update" | "installed" => {
  if (!presences[slug]) return "install"
  return updates[slug] ? "update" : "installed"
}

const StoreSkeleton = (): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-9 w-full rounded-xl" />
    <div className="overflow-hidden rounded-xl border border-border">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton
          key={index}
          className="h-16 rounded-none border-b border-border last:border-0"
        />
      ))}
    </div>
  </div>
)

const CategoryChip = ({ active, label, onSelect }: { active: boolean; label: string; onSelect: () => void }): React.JSX.Element => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
      active ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground hover:bg-foreground/16 hover:text-foreground",
    )}
  >
    {label}
  </button>
)

export const StoreView = ({
  installingSlug,
  installQueueCount,
  onInstall,
  onOpenInstalled,
  onOpenWebsite,
  onRetryQueue,
  onSelectPresence,
  presences,
  seedQuery = "",
  selectedSlug,
  updates,
}: Props): React.JSX.Element => {
  const { items, isError, isLoading, refetch } = usePresenceCatalog()
  const [query, setQuery] = useState(seedQuery)
  const [category, setCategory] = useState<PresenceCategory | null>(null)

  useEffect(() => {
    setQuery(seedQuery)
  }, [seedQuery])

  const categories = useMemo(() => catalogCategories(items), [items])
  const filtered = useMemo(() => filterStorePresences(items, query, category), [category, items, query])
  const selected = selectedSlug ? (items.find((item) => item.slug === selectedSlug) ?? null) : null

  const openPresence = (slug: string): void => {
    if (presences[slug]) {
      onOpenInstalled(slug)
      return
    }
    onSelectPresence(slug)
  }

  useEffect(() => {
    if (selected && presences[selected.slug]) onOpenInstalled(selected.slug)
  }, [selected, presences, onOpenInstalled])

  if (isLoading) return <StoreSkeleton />

  if (isError) {
    return (
      <Empty className="gap-2 border border-border bg-card">
        <EmptyTitle>{t("store-error")}</EmptyTitle>
        <Button
          size="sm"
          onClick={() => void refetch()}
          className="mt-2"
        >
          {t("store-retry")}
        </Button>
      </Empty>
    )
  }

  if (selected && !presences[selected.slug]) {
    return (
      <StoreDetail
        action={storeAction(selected.slug, presences, updates)}
        installing={installingSlug === selected.slug}
        onBack={() => onSelectPresence(null)}
        onInstall={onInstall}
        onOpenWebsite={onOpenWebsite}
        presence={selected}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <InstallQueueBanner
        count={installQueueCount}
        onRetry={onRetryQueue}
      />

      <div className="relative">
        <RiSearchLine className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("store-search")}
          aria-label={t("store-search")}
          className="pl-8"
        />
      </div>

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
        <Empty className="gap-2 border border-border bg-card">
          <EmptyTitle>{t("store-empty")}</EmptyTitle>
          <EmptyDescription>{t("home-search-empty")}</EmptyDescription>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border divide-y divide-border">
          {filtered.map((presence: StorePresence) => (
            <StoreCard
              key={presence.slug}
              action={storeAction(presence.slug, presences, updates)}
              installing={installingSlug === presence.slug}
              onInstall={onInstall}
              onOpen={openPresence}
              onOpenWebsite={onOpenWebsite}
              presence={presence}
            />
          ))}
        </div>
      )}
    </div>
  )
}
