"use client";

import type { PresenceCategory } from "@/lib/data/presences";
import { useTranslations } from "next-intl";
import type { FC } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "../ui/toggle";

type SortOption = "name-asc" | "name-desc" | "popular" | "recent";

type Props = {
  availableCategories: PresenceCategory[]
  selectedCategories: PresenceCategory[]
  sortBy: SortOption
  authors: { github: string; name: string }[]
  author: string
  onToggleCategory: (category: PresenceCategory) => void
  onSortChange: (sort: SortOption) => void
  onAuthorChange: (github: string) => void
};

export const MarketplaceFilters: FC<Props> = ({
  availableCategories,
  selectedCategories,
  sortBy,
  authors,
  author,
  onToggleCategory,
  onSortChange,
  onAuthorChange,
}) => {
  const t = useTranslations("marketplace-page");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex flex-wrap gap-2">
        {availableCategories.map((category) => (
          <Toggle
            key={category}
            pressed={selectedCategories.includes(category)}
            onClick={() => onToggleCategory(category)}
          >
            {t(`categories.${category}`)}
          </Toggle>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {authors.length > 0 ? (
          <Select value={author || "all"} onValueChange={(value) => onAuthorChange(value === "all" ? "" : value)}>
            <SelectTrigger size="sm" className="w-fit">
              <SelectValue placeholder={t("author-label")} />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">{t("author-all")}</SelectItem>
              {authors.map((item) => (
                <SelectItem key={item.github} value={item.github}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <span className="text-sm text-dim-foreground">{t("sort-label")}</span>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger size="sm" className="w-fit">
            <SelectValue placeholder={t("sort-label")} />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="popular">{t("sort-popular")}</SelectItem>
            <SelectItem value="recent">{t("sort-recent")}</SelectItem>
            <SelectItem value="name-asc">{t("sort-name-asc")}</SelectItem>
            <SelectItem value="name-desc">{t("sort-name-desc")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
