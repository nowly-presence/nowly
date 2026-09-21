import { RiBox3Line, RiCheckboxMultipleLine, RiCheckDoubleLine, RiCloseLine, RiDeleteBinLine, RiMoreLine, RiSearchLine, RiToggleLine } from "@remixicon/react"
import { useMemo, useState } from "react"
import { getCategoryLabel, groupByCategory, matchesPresenceSearch, type PresenceListEntry } from "@/features/activity/presence-list.model"
import { PresenceGridCard } from "@/features/activity/presence-grid-card"
import { PresenceListItem } from "@/features/activity/presence-list-item"
import { t } from "@/shared/i18n"
import type { PresenceDisplayMode } from "@/shared/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog"
import { Button } from "@/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/ui/empty"
import { Input } from "@/ui/input"
import { Skeleton } from "@/ui/skeleton"

type Props = {
  displayMode: PresenceDisplayMode
  entries: PresenceListEntry[]
  isLoading: boolean
  onOpen: (slug: string) => void
  onOpenWebsite: (slug: string) => void
  onRemove: (slug: string) => void
  onBulkRemove: (slugs: string[]) => void
  onBulkToggle: (slugs: string[], enabled: boolean) => void
  onSchedule: (slug: string) => void
  onSnooze: (slug: string) => void
  onToggle: (slug: string, enabled: boolean) => void
  onUpdatePresence: (slug: string) => void
  showSchedule: boolean
  updates: Record<string, string>
  updatingSlug?: string | null
}

const PresenceListSkeleton = ({ displayMode }: { displayMode: PresenceDisplayMode }): React.JSX.Element => (
  <div className={displayMode === "grid" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2"}>
    {Array.from({ length: 4 }, (_, index) => (
      <Skeleton
        key={index}
        className={displayMode === "grid" ? "h-20 rounded-xl" : "h-16 rounded-xl"}
      />
    ))}
  </div>
)

export const PresenceList = ({
  displayMode,
  entries,
  isLoading,
  onOpen,
  onOpenWebsite,
  onRemove,
  onBulkRemove,
  onBulkToggle,
  onSchedule,
  onSnooze,
  onToggle,
  onUpdatePresence,
  showSchedule,
  updates,
  updatingSlug,
}: Props): React.JSX.Element => {
  const [query, setQuery] = useState("")
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmRemove, setConfirmRemove] = useState(false)

  const filtered = useMemo(() => entries.filter(([slug, presence]) => matchesPresenceSearch(slug, presence, query)), [query, entries])

  const exitSelectMode = (): void => {
    setSelectMode(false)
    setSelected(new Set())
  }

  const toggleSelected = (slug: string): void => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const selectAll = (): void => setSelected(new Set(filtered.map(([slug]) => slug)))

  const selectedPresences = useMemo(() => entries.filter(([slug]) => selected.has(slug)), [entries, selected])
  const hasEnabledSelected = selectedPresences.some(([, presence]) => presence.enabled)
  const hasDisabledSelected = selectedPresences.some(([, presence]) => !presence.enabled)

  const bulkEnable = (enabled: boolean): void => onBulkToggle([...selected], enabled)

  const bulkRemove = (): void => {
    onBulkRemove([...selected])
    setConfirmRemove(false)
    exitSelectMode()
  }

  if (isLoading) return <PresenceListSkeleton displayMode={displayMode} />

  if (entries.length === 0) {
    return (
      <Empty className="gap-2 border border-border bg-card">
        <EmptyMedia variant="icon">
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
      {selectMode ? (
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2">
          <span className="flex-1 truncate text-sm font-medium text-foreground">
            {t("bulk-selected-count", { count: String(selected.size) })}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={selectAll}
            aria-label={t("bulk-select-all")}
            title={t("bulk-select-all")}
          >
            <RiCheckDoubleLine />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={selected.size === 0}
                  aria-label={t("bulk-actions")}
                />
              }
            >
              <RiMoreLine />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasDisabledSelected ? (
                <DropdownMenuItem onClick={() => bulkEnable(true)}>
                  <RiToggleLine />
                  {t("bulk-enable")}
                </DropdownMenuItem>
              ) : null}
              {hasEnabledSelected ? (
                <DropdownMenuItem onClick={() => bulkEnable(false)}>
                  <RiToggleLine />
                  {t("bulk-disable")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmRemove(true)}
              >
                <RiDeleteBinLine />
                {t("uninstall")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={exitSelectMode}
            aria-label={t("bulk-select-done")}
            title={t("bulk-select-done")}
          >
            <RiCloseLine />
          </Button>

          <AlertDialog
            open={confirmRemove}
            onOpenChange={setConfirmRemove}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("uninstall")}</AlertDialogTitle>
                <AlertDialogDescription>{t("bulk-uninstall-confirm", { count: String(selected.size) })}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={bulkRemove}
                  className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                >
                  <RiDeleteBinLine />
                  {t("uninstall")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("home-search")}
              aria-label={t("home-search")}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectMode(true)}
            aria-label={t("bulk-select")}
          >
            <RiCheckboxMultipleLine />
          </Button>
        </div>
      )}

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
            <section
              key={category}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 truncate text-base font-semibold text-foreground">{getCategoryLabel(category)}</h2>
                <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{countLabel}</span>
              </div>

              {displayMode === "grid" ? (
                <div className="grid grid-cols-2 gap-2">
                  {sorted.map(([slug, presence]) => (
                    <PresenceGridCard
                      key={slug}
                      slug={slug}
                      presence={presence}
                      onOpen={onOpen}
                      onOpenWebsite={onOpenWebsite}
                      onRemove={onRemove}
                      onSchedule={onSchedule}
                      onSnooze={onSnooze}
                      onToggle={onToggle}
                      onUpdatePresence={onUpdatePresence}
                      showSchedule={showSchedule}
                      updateAvailable={updates[slug]}
                    />
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
                      onOpenWebsite={onOpenWebsite}
                      onRemove={onRemove}
                      onSnooze={onSnooze}
                      onUpdatePresence={onUpdatePresence}
                      onSchedule={onSchedule}
                      onToggle={onToggle}
                      showSchedule={showSchedule}
                      updateAvailable={updates[slug]}
                      selectMode={selectMode}
                      selected={selected.has(slug)}
                      onToggleSelected={toggleSelected}
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
