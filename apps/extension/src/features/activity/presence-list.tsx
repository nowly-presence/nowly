import { RiBox3Line, RiSearchLine } from "@remixicon/react"
import { useMemo, useState } from "react"
import { getCategoryLabel, groupByCategory, matchesPresenceSearch, type PresenceListEntry } from "@/features/activity/presence-list.model"
import { PresenceGridCard } from "@/features/activity/presence-grid-card"
import { PresenceListItem } from "@/features/activity/presence-list-item"
import { t } from "@/shared/i18n"
import type { PresenceDisplayMode } from "@/shared/types"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/ui/empty"
import { Input } from "@/ui/input"
import { Skeleton } from "@/ui/skeleton"

type Props = {
  displayMode: PresenceDisplayMode
  entries: PresenceListEntry[]
  isLoading: boolean
  onOpen: (slug: string) => void
  onSchedule: (slug: string) => void
  onToggle: (slug: string, enabled: boolean) => void
  onUpdatePresence: (slug: string) => void
  showSchedule: boolean
  updates: Record<string, string>
  updatingSlug?: string | null
}

const PresenceListSkeleton = ({ displayMode }: { displayMode: PresenceDisplayMode }): React.JSX.Element => (
  <div className={displayMode === "grid" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
    {Array.from({ length: 4 }, (_, index) => (
      <Skeleton key={index} className={displayMode === "grid" ? "h-20 rounded-xl" : "h-16 rounded-xl"} />
    ))}
  </div>
)

export const PresenceList = ({ displayMode, entries, isLoading, onOpen, onSchedule, onToggle, onUpdatePresence, showSchedule, updates, updatingSlug }: Props): React.JSX.Element => {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => entries.filter(([slug, presence]) => matchesPresenceSearch(slug, presence, query)), [query, entries])

  if (isLoading) return <PresenceListSkeleton displayMode={displayMode} />

  if (entries.length === 0) {
    return (
      <Empty className="gap-2 border border-border bg-card">
        <EmptyMedia variant="icon" className="mb-1 size-12 [&_svg]:size-6">
          <RiBox3Line />
        </EmptyMedia>
        <EmptyTitle>{t("empty-title")}</EmptyTitle>
        <EmptyDescription>{t("empty-description")}</EmptyDescription>
      </Empty>
    )
  }

  const groups = groupByCategory(filtered)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <RiSearchLine className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("home-search")} aria-label={t("home-search")} className="pl-8" />
      </div>

      {filtered.length === 0 ? (
        <Empty className="gap-2 border border-border bg-card">
          <EmptyTitle>{t("home-search-empty-title")}</EmptyTitle>
          <EmptyDescription>{t("home-search-empty")}</EmptyDescription>
        </Empty>
      ) : (
        groups.map(([category, categoryEntries]) => {
          const enabled = categoryEntries.filter(([, presence]) => presence.enabled)
          const disabled = categoryEntries.filter(([, presence]) => !presence.enabled)
          const sorted = [...enabled, ...disabled]
          const countLabel =
            enabled.length === 0
              ? t("category-count-none")
              : enabled.length === categoryEntries.length
                ? t("category-count-all")
                : t("category-count-some", { count: String(enabled.length), total: String(categoryEntries.length) })

          return (
            <section key={category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 truncate text-base font-semibold text-foreground">{getCategoryLabel(category)}</h2>
                <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{countLabel}</span>
              </div>

              {displayMode === "grid" ? (
                <div className="grid grid-cols-2 gap-2">
                  {sorted.map(([slug, presence]) => (
                    <PresenceGridCard key={slug} slug={slug} presence={presence} onOpen={onOpen} updateAvailable={updates[slug]} />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border divide-y divide-border">
                  {sorted.map(([slug, presence]) => (
                    <PresenceListItem
                      key={slug}
                      slug={slug}
                      presence={presence}
                      onOpen={onOpen}
                      onUpdatePresence={onUpdatePresence}
                      onSchedule={onSchedule}
                      onToggle={onToggle}
                      showSchedule={showSchedule}
                      updateAvailable={updates[slug]}
                      updating={updatingSlug === slug}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })
      )}
    </div>
  )
}
