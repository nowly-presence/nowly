"use client";

import { LibraryCard } from "@/components/library/library-card";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import type { LibraryPresence } from "@/lib/library-catalog";
import { cn } from "@/lib/utils";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useLayoutEffect, useRef, useState } from "react";

const PAGE_SIZE = 9;
const DOCK_ROOT_MARGIN = "0px 0px -96px 0px";

const paginationRange = (current: number, total: number): Array<number | "ellipsis"> => {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 3);
    pages.add(total - 2);
    pages.add(total - 1);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).toSorted((a, b) => a - b);
  const range: Array<number | "ellipsis"> = [];
  for (const page of sorted) {
    const previous = range[range.length - 1];
    if (typeof previous === "number" && page - previous > 1) range.push("ellipsis");
    range.push(page);
  }
  return range;
};

const LibraryPaginationControls = ({
  page,
  totalPages,
  onPage,
  docked = false,
}: {
  page: number
  totalPages: number
  onPage: (next: number) => void
  docked?: boolean
}) => {
  const t = useTranslations("libraryPage");

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        docked ? "gap-4" : "flex-col gap-3",
      )}
    >
      <p className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
        {t("page-status", { page, total: totalPages })}
      </p>
      <Pagination aria-label={t("pagination")} className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="default"
              className="pl-1.5"
              disabled={page <= 1}
              aria-label={t("previous")}
              onClick={() => onPage(page - 1)}
            >
              <RiArrowLeftSLine data-icon="inline-start" />
              <span className="hidden sm:inline">{t("previous")}</span>
            </Button>
          </PaginationItem>

          {paginationRange(page, totalPages).map((item, index) => (
            <PaginationItem key={`${item}-${index}`}>
              {item === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <Button
                  type="button"
                  variant={item === page ? "outline" : "ghost"}
                  size="icon"
                  aria-current={item === page ? "page" : undefined}
                  aria-label={t("go-to-page", { page: item })}
                  onClick={() => onPage(item)}
                >
                  {item}
                </Button>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="default"
              className="pr-1.5"
              disabled={page >= totalPages}
              aria-label={t("next")}
              onClick={() => onPage(page + 1)}
            >
              <span className="hidden sm:inline">{t("next")}</span>
              <RiArrowRightSLine data-icon="inline-end" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

type PaginatedLibraryGridProps = {
  items: LibraryPresence[]
  resetKey?: string
  className?: string
};

export const PaginatedLibraryGrid = ({ items, resetKey, className }: PaginatedLibraryGridProps) => {
  const locale = useLocale();
  const gridRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1).withOptions({ history: "push" }));
  const [docked, setDocked] = useState(false);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const showPagination = totalPages > 1;

  useLayoutEffect(() => {
    setPage(1);
  }, [resetKey]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !showPagination) {
      setDocked(false);
      return;
    }

    const sync = (intersecting: boolean) => setDocked(!intersecting);
    sync(anchor.getBoundingClientRect().top <= window.innerHeight - 96);

    const observer = new IntersectionObserver(
      ([entry]) => sync(entry.isIntersecting),
      { threshold: 0, rootMargin: DOCK_ROOT_MARGIN },
    );
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [showPagination, slice.length, safePage]);

  const goToPage = (next: number) => {
    const clamped = Math.min(totalPages, Math.max(1, next));
    if (clamped === safePage) return;

    const wasDocked = docked;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setPage(clamped);

    if (wasDocked) return;
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={cn(docked && "pb-16")}>
      <section
        ref={gridRef}
        className={cn("mt-8 grid scroll-mt-32 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      >
        {slice.map((presence) => (
          <LibraryCard key={presence.slug} presence={presence} locale={locale} />
        ))}
      </section>

      {showPagination ? (
        <>
          <div ref={anchorRef} className={cn("mt-12", docked && "h-16")}>
            {docked ? null : (
              <LibraryPaginationControls
                page={safePage}
                totalPages={totalPages}
                onPage={goToPage}
              />
            )}
          </div>
          {docked ? (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 shadow-lg backdrop-blur-sm">
              <div className="mx-auto flex w-full max-w-300 justify-center px-6 py-3">
                <LibraryPaginationControls
                  page={safePage}
                  totalPages={totalPages}
                  onPage={goToPage}
                  docked
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
