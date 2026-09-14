"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { MarketplaceGridSkeleton } from "@/components/library/marketplace-grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePresences } from "@/hooks/use-presences";
import { trackPublicAnalytics } from "@/lib/analytics-client";
import { CATEGORIES } from "@/lib/data/categories";
import { type PresenceCategory } from "@/lib/data/presences";
import { ADSENSE_ENABLED } from "@/lib/constants";
import {
  parseLibraryCategories,
  parseLibrarySort,
  presenceMatchesGithub,
  uniqueGithubAuthors,
  type LibrarySort,
} from "@/lib/library-query";
import { useAdStatus } from "@/providers/ad-status-provider";
import { IconAlertCircle, IconChevronLeft, IconChevronRight, IconRefresh } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { MarketplaceFilters } from "./marketplace-filters";
import { MarketplaceGrid } from "./marketplace-grid";
import { MarketplaceSearch } from "./marketplace-search";
import { PresenceContributeLinks } from "./presence-contribute-links";

export const MarketplaceClient: FC = (): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("marketplace-page");
  const { data: presences, isLoading, isError, refetch } = usePresences();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { hasAds, adFree } = useAdStatus();
  const lastFilterEventRef = useRef("");

  const searchQuery = searchParams.get("q") ?? "";
  const selectedCategories = parseLibraryCategories(searchParams.get("category"));
  const sortBy = parseLibrarySort(searchParams.get("sort"));
  const author = searchParams.get("author") ?? "";
  const currentPage = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const itemsPerPage = ADSENSE_ENABLED && hasAds && !adFree ? 8 : 9;

  const replaceParams = useCallback((patch: Record<string, string | null>, resetPage = false) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (resetPage) next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const availableCategories = useMemo<PresenceCategory[]>(() => {
    if (!presences) return [];
    const categories = new Set(presences.map((presence) => presence.category));
    return CATEGORIES.filter((category) => categories.has(category));
  }, [presences]);

  const authors = useMemo(() => uniqueGithubAuthors(presences ?? []), [presences]);

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

    if (author) {
      result = result.filter((p) => presenceMatchesGithub(p, author));
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
  }, [author, searchQuery, selectedCategories, sortBy, presences]);

  const totalPages = Math.max(1, Math.ceil(filteredPresences.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPresences = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredPresences.slice(start, start + itemsPerPage);
  }, [filteredPresences, itemsPerPage, safePage]);

  const toggleCategory = (category: PresenceCategory): void => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
    replaceParams({ category: next.length > 0 ? next.join(",") : null }, true);
  };

  useEffect(() => {
    if (!presences) return;
    const category = selectedCategories.join(",");
    const signature = `${category}|${sortBy}|${author}|${filteredPresences.length}|${Boolean(searchQuery)}`;
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
  }, [author, filteredPresences.length, locale, presences, searchQuery, selectedCategories, sortBy]);

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
          <PresenceContributeLinks className="mx-auto mt-4 max-w-lg text-center text-sm text-muted-foreground" />
        </div>

        <MarketplaceSearch
          value={searchQuery}
          placeholder={t("search-placeholder")}
          onChange={(value) => replaceParams({ q: value || null }, true)}
        />

        <MarketplaceFilters
          availableCategories={availableCategories}
          selectedCategories={selectedCategories}
          sortBy={sortBy}
          authors={authors}
          author={author}
          onToggleCategory={toggleCategory}
          onSortChange={(sort: LibrarySort) => replaceParams({ sort: sort === "popular" ? null : sort }, true)}
          onAuthorChange={(value) => replaceParams({ author: value || null }, true)}
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
                    onClick={() => replaceParams({ page: safePage <= 2 ? null : String(safePage - 1) })}
                    disabled={safePage <= 1}
                    className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    aria-label="Previous page"
                  >
                    <IconChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => replaceParams({ page: page === 1 ? null : String(page) })}
                      className={`min-w-8 h-8 text-sm rounded-lg transition-colors ${
                        page === safePage
                          ? "bg-accent text-accent-foreground font-medium"
                          : "hover:bg-accent/10 text-dim-foreground"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => replaceParams({ page: String(Math.min(totalPages, safePage + 1)) })}
                    disabled={safePage >= totalPages}
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
            onReset={() => router.replace(pathname, { scroll: false })}
          />
        )}
      </div>
    </PageLayout>
  );
};
