import { useEffect, useMemo, useState } from "react"
import { RiSignalWifiErrorLine } from "@remixicon/react"
import { ScreenBody, ScreenTitle } from "@/components/shared/screen"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { formatCompact } from "@/lib/format"
import { track } from "@/lib/messages"
import { CATEGORIES } from "@/lib/presence-categories"
import { fromCatalog } from "@/lib/presence-view"
import { Button } from "@/ui/button"
import { Card } from "@/ui/card"
import { DotSeparator } from "@/ui/dot-separator"
import { EmptyState } from "@/ui/empty-state"
import { LiveDot } from "@/ui/live-dot"
import { Skeleton } from "@/ui/skeleton"
import { filterCatalog, newPresenceSlugs, trendingPresences, type LibraryCategory, type LibrarySort } from "@/features/library/library-catalog"
import { LibraryResultsSection } from "@/features/library/library-results-section"
import { LibrarySearchBar } from "@/features/library/library-search-bar"
import { TrendingCarousel } from "@/features/library/trending-carousel"

const SEARCH_TRACK_DELAY_MS = 900
const SEARCH_TRACK_MIN_LENGTH = 2

export const LibraryView = () => {
  const { state, refresh } = useExtensionState()
  const { t, locale } = useI18n()
  const { libraryQuery, setLibraryQuery } = useNav()
  const [category, setCategory] = useState<LibraryCategory>("all")
  const [sort, setSort] = useState<LibrarySort>("popular")

  useEffect(() => {
    void refresh.catalog()
  }, [refresh])

  const views = useMemo(() => state.catalog.items.map((item) => fromCatalog(item, locale)), [state.catalog.items, locale])
  const categories = useMemo(() => CATEGORIES.filter((value) => views.some((view) => view.category === value)), [views])
  const activeNow = useMemo(() => views.reduce((sum, view) => sum + (view.activeUsers ?? 0), 0), [views])
  const results = useMemo(() => filterCatalog(views, { category, query: libraryQuery, sort, locale }), [views, category, libraryQuery, sort, locale])
  const trending = useMemo(() => trendingPresences(views), [views])
  const newSlugs = useMemo(() => newPresenceSlugs(views), [views])
  const hasResults = results.length > 0

  const trackSearch = useDebouncedCallback((query: string, found: boolean) => {
    if (query.trim().length >= SEARCH_TRACK_MIN_LENGTH) track("search_performed", { source: "extension_library", payload: { locale, hasResults: found } })
  }, SEARCH_TRACK_DELAY_MS)

  useEffect(() => {
    trackSearch(libraryQuery, hasResults)
  }, [libraryQuery, hasResults, trackSearch])

  const browsing = !libraryQuery.trim() && category === "all"
  const loading = state.catalog.status === "loading" || state.catalog.status === "idle"

  return (
    <ScreenBody className="gap-5">
      <ScreenTitle
        title={t("library.title")}
        subtitle={
          views.length > 0 ? (
            <span className="flex items-center gap-1.5">
              {t("library.count", { count: views.length })}
              {activeNow > 0 && (
                <>
                  <DotSeparator />
                  <LiveDot />
                  {t("library.activeNow", { count: formatCompact(activeNow, locale) })}
                </>
              )}
            </span>
          ) : (
            t("library.subtitle")
          )
        }
      />

      <LibrarySearchBar query={libraryQuery} onQueryChange={setLibraryQuery} category={category} onCategoryChange={setCategory} categories={categories} />

      {state.catalog.status === "error" && views.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RiSignalWifiErrorLine className="size-5" />}
            title={t("library.errorTitle")}
            description={t("library.errorDescription")}
            action={
              <Button variant="secondary" onClick={() => void refresh.catalog(true)}>
                {t("action.retry")}
              </Button>
            }
          />
        </Card>
      ) : loading && views.length === 0 ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-36 rounded-lg" />
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : (
        <>
          {browsing && <TrendingCarousel views={trending} />}
          <LibraryResultsSection results={results} newSlugs={newSlugs} browsing={browsing} query={libraryQuery} category={category} sort={sort} onSortChange={setSort} />
        </>
      )}
    </ScreenBody>
  )
}
