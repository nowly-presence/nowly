"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { MarketplaceGridSkeleton } from "@/components/library/marketplace-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresences } from "@/hooks/use-presences";
import { trackPublicAnalytics } from "@/lib/analytics-client";
import { CATEGORIES } from "@/lib/data/categories";
import { type PresenceCategory } from "@/lib/data/presences";
import { ADSENSE_ENABLED } from "@/lib/constants";
import { useAdStatus } from "@/providers/ad-status-provider";
import { IconAlertCircle, IconChevronLeft, IconChevronRight, IconRefresh } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MarketplaceFilters } from "./marketplace-filters";
import { MarketplaceGrid } from "./marketplace-grid";
import { MarketplaceSearch } from "./marketplace-search";

type SortOption = "name-asc" | "name-desc" | "popular" | "recent";

export const MarketplaceClient: FC = (): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("marketplace-page");
  const { data: presences, isLoading, isError, refetch } = usePresences();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<PresenceCategory[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const { hasAds, adFree } = useAdStatus();
  const [currentPage, setCurrentPage] = useState(1);
  const lastFilterEventRef = useRef("");

  const itemsPerPage = ADSENSE_ENABLED && hasAds && !adFree ? 8 : 9;

  const availableCategories = useMemo<PresenceCategory[]>(() => {
    if (!presences) return [];
    const categories = new Set(presences.map((presence) => presence.category));
    return CATEGORIES.filter((category) => categories.has(category));
  }, [presences]);

  useEffect(() => {
    if (!presences) return;
    setSelectedCategories((prev) =>
      prev.filter((category) => availableCategories.includes(category)),
    );
  }, [availableCategories, presences]);

  useEffect(() => {
    trackPublicAnalytics({
      key: "marketplace_page_view",
      payload: { source: "library", locale },
    });
  }, [locale]);

  const filteredPresences = useMemo(() => {
    if (!presences) return [];

    let result = [...presences];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "popular":
        result.sort((a, b) => b.activeUsers - a.activeUsers);
        break;
      case "recent":
        result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }

    return result;
  }, [searchQuery, selectedCategories, sortBy, presences]);

  const totalPages = Math.max(1, Math.ceil(filteredPresences.length / itemsPerPage));
  const paginatedPresences = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPresences.slice(start, start + itemsPerPage);
  }, [filteredPresences, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, sortBy]);

  const toggleCategory = (category: PresenceCategory): void => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  useEffect(() => {
    if (!presences) return;
    const category = selectedCategories.join(",");
    const signature = `${category}|${sortBy}|${filteredPresences.length}|${Boolean(searchQuery)}`;
    if (signature === lastFilterEventRef.current) return;
    lastFilterEventRef.current = signature;

    trackPublicAnalytics({
      key: filteredPresences.length === 0 ? "marketplace_no_results" : "marketplace_filter",
      payload: {
        source: "library",
        locale,
        category,
        sort: sortBy,
        resultCount: filteredPresences.length,
      },
    });
  }, [filteredPresences.length, locale, presences, searchQuery, selectedCategories, sortBy]);

  return (
    <PageLayout>
      <div className="max-w-300 mx-auto px-6">
        <div className="text-center max-w-150 mx-auto mb-12">
          <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
            {t("badge")}
          </span>
          <h1 className="text-[2.5rem] mb-4 font-extrabold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <MarketplaceSearch
          value={searchQuery}
          placeholder={t("search-placeholder")}
          onChange={setSearchQuery}
        />

        <MarketplaceFilters
          availableCategories={availableCategories}
          selectedCategories={selectedCategories}
          sortBy={sortBy}
          onToggleCategory={toggleCategory}
          onSortChange={setSortBy}
        />

        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-dim-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-24 inline-block" />
            ) : (
              t("results", { count: filteredPresences.length })
            )}
          </div>

          {(totalPages > 1 || isLoading) && (
            <div className="flex items-center gap-1">
              {isLoading ? (
                <>
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="w-8 h-8 rounded-lg" />
                  ))}
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Previous page"
                  >
                    <IconChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-8 h-8 text-sm rounded-lg transition-colors ${
                        page === currentPage
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-accent/10 text-dim-foreground"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Next page"
                  >
                    <IconChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {isLoading && <MarketplaceGridSkeleton />}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <IconAlertCircle className="w-10 h-10 text-destructive mb-4" />
            <p className="text-muted-foreground mb-4">Failed to load platforms</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <IconRefresh className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <MarketplaceGrid
            platforms={paginatedPresences}
            locale={locale}
            onReset={() => {
              setSearchQuery("");
              setSelectedCategories([]);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </PageLayout>
  );
};
