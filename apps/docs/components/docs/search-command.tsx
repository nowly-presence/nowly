"use client";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FC } from "react";
import { Spinner } from "../ui/spinner";

type SearchResult = {
  title: string;
  href: string;
  description?: string;
  content: string;
  matches: number;
  matchContext?: string;
};

type SearchCommandProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SearchCommand: FC<SearchCommandProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, locale]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;


  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search documentation..."
        value={query}
        onValueChange={setQuery}
      />

      <CommandList>
        {isSearching && hasQuery ? (
          <CommandEmpty>
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner className="size-4" />
              Searching...
            </span>
          </CommandEmpty>
        ) : null}

        {!isSearching && hasQuery && !hasResults ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : null}

        {!isSearching && !hasQuery ? (
          <CommandEmpty>Type to search...</CommandEmpty>
        ) : null}

        {!isSearching && hasResults ? (
          <CommandGroup
            heading={`${results.length} result${results.length > 1 ? "s" : ""}`}
          >
            {results.map((result) => (
              <CommandItem
                key={result.href}
                value={[
                  result.title,
                  result.description,
                  result.matchContext,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onSelect={() => handleSelect(result.href)}
                className="px-4 py-3 rounded-xl data-[selected=true]:bg-card-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{result.title}</p>

                  {result.matchContext ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      ...{result.matchContext}...
                    </p>
                  ) : result.description ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {result.description}
                    </p>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
};