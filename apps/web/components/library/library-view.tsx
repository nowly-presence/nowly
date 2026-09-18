"use client";

import { PaginatedLibraryGrid } from "@/components/library/paginated-library-grid";
import { Button, ButtonLink, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, Input, cn } from "@nowly/ui";




import {
  catalogCategories,
  presenceMatchesGithub,
  presenceSearchText,
  type LibraryCategory,
  type LibraryPresence,
} from "@/lib/library-catalog";

import { RiCloseLine, RiSearchLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

const navJoinOffset = () =>
  window.matchMedia("(min-width: 640px)").matches ? 116 : 84;

const useNavJoin = () => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const connect = () =>
      new IntersectionObserver(
        ([entry]) => setJoined(!entry.isIntersecting),
        { threshold: 0, rootMargin: `-${navJoinOffset()}px 0px 0px 0px` },
      );

    let observer = connect();
    observer.observe(sentinel);

    const media = window.matchMedia("(min-width: 640px)");
    const onViewport = () => {
      observer.disconnect();
      observer = connect();
      observer.observe(sentinel);
    };
    media.addEventListener("change", onViewport);

    return () => {
      media.removeEventListener("change", onViewport);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (joined) root.setAttribute("data-nav-join", "");
    else root.removeAttribute("data-nav-join");
    return () => root.removeAttribute("data-nav-join");
  }, [joined]);

  useEffect(() => {
    const root = document.documentElement;
    const toolbar = toolbarRef.current;
    if (!joined || !toolbar) {
      root.style.removeProperty("--nav-join-panel");
      return;
    }

    const apply = () => {
      const navHeight = window.matchMedia("(min-width: 640px)").matches ? 84 : 68;
      root.style.setProperty("--nav-join-panel", `${navHeight + toolbar.offsetHeight}px`);
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(toolbar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--nav-join-panel");
    };
  }, [joined]);

  return { joined, sentinelRef, toolbarRef };
};

export const LibraryView = ({
  items,
  authorHandle = null,
}: {
  items: LibraryPresence[]
  authorHandle?: string | null
}) => {
  const t = useTranslations("libraryPage");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<LibraryCategory | "all">("all");
  const deferredQuery = useDeferredValue(query);
  const trimmedQuery = deferredQuery.trim();
  const mentionMatch = /^@(\S+)/.exec(trimmedQuery);
  const typedAuthorHandle = mentionMatch?.[1] ?? null;
  const effectiveAuthorHandle = authorHandle ?? typedAuthorHandle;
  const normalizedQuery = (mentionMatch ? trimmedQuery.slice(mentionMatch[0].length) : trimmedQuery)
    .trim()
    .toLowerCase();
  const categories = catalogCategories(items);
  const { joined, sentinelRef, toolbarRef } = useNavJoin();

  const results = useMemo(() => {
    return items.filter((presence) => {
      if (effectiveAuthorHandle && !presenceMatchesGithub(presence, effectiveAuthorHandle)) return false;
      if (category !== "all" && presence.category !== category) return false;
      if (!normalizedQuery) return true;
      return presenceSearchText(presence).includes(normalizedQuery);
    });
  }, [effectiveAuthorHandle, category, items, normalizedQuery]);

  const isStale = query !== deferredQuery;

  return (
    <div className="pb-24 pt-16 sm:pb-32 sm:pt-24">
      <header className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <div className="max-w-160">
          <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="text-pretty text-[2.2rem] font-medium leading-[1.08] tracking-tight text-foreground sm:text-[2.75rem]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-[42ch] text-[1.05rem] leading-relaxed text-foreground/68">
            {t("description")}
          </p>
        </div>
      </header>

      <div className="h-10" />
      <div ref={sentinelRef} aria-hidden className="h-px" />

      <div className={cn("sticky top-21 px-4 sm:top-29 sm:px-6 lg:px-10", joined ? "z-50" : "z-40")}>
        <div
          ref={toolbarRef}
          className={cn(
            "mx-auto max-w-[1200px] space-y-4 py-3",
            joined ? "px-3 sm:px-4" : null,
          )}
        >
          <label className="relative block max-w-xl">
            <span className="sr-only">{t("search-label")}</span>
            <RiSearchLine className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search")}
              className="h-11 rounded-xl bg-card pr-10 pl-10 text-base shadow-[0_0_0_1px_rgba(7,8,12,0.08)] dark:shadow-[0_0_0_1px_rgba(228,242,255,0.08)]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label={t("clear-search")}
              >
                <RiCloseLine className="size-4" />
              </button>
            ) : null}
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {authorHandle ? (
              <Link
                href="/library"
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-sm font-medium text-background"
              >
                @{authorHandle}
                <RiCloseLine className="size-3.5" />
              </Link>
            ) : typedAuthorHandle ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-sm font-medium text-background"
              >
                @{typedAuthorHandle}
                <RiCloseLine className="size-3.5" />
              </button>
            ) : null}
            <FilterChip
              active={category === "all"}
              onClick={() => setCategory("all")}
            >
              {t("all")}
            </FilterChip>
            {categories.map((key) => (
              <FilterChip
                key={key}
                active={category === key}
                onClick={() => setCategory(key)}
              >
                {t(`categories.${key}`)}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-10">
        <p className="mt-2 text-sm text-muted-foreground">
          {t("count", { count: results.length })}
        </p>

        {results.length > 0 ? (
          <PaginatedLibraryGrid
            items={results}
            resetKey={`${effectiveAuthorHandle ?? ""}:${category}:${normalizedQuery}`}
            className={isStale ? "opacity-70" : undefined}
          />
        ) : (
          <Empty className="mt-16 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RiSearchLine />
              </EmptyMedia>
              <EmptyTitle>{t("empty-title")}</EmptyTitle>
              <EmptyDescription>{t("empty-description")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {authorHandle ? (
                <ButtonLink href="/library" variant="outline">
                  {t("clear")}
                </ButtonLink>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  {t("clear")}
                </Button>
              )}
            </EmptyContent>
          </Empty>
        )}
      </div>
    </div>
  );
};

const FilterChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      "h-8 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors",
      active
        ? "bg-foreground text-background"
        : "bg-foreground/5 text-foreground/80 hover:bg-foreground/9 hover:text-foreground",
    )}
  >
    {children}
  </button>
);
