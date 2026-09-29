import { useRef } from "react"
import { RiCloseCircleFill, RiSearchLine } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { categoryKey } from "@/lib/presence-categories"
import type { PresenceMetadata } from "@/shared/types"
import { Chip } from "@/ui/chip"
import { HScroll } from "@/ui/horizontal-scroller"
import { Input } from "@/ui/input"
import type { LibraryCategory } from "@/features/library/library-catalog"

type LibrarySearchBarProps = {
  query: string
  onQueryChange: (query: string) => void
  category: LibraryCategory
  onCategoryChange: (category: LibraryCategory) => void
  categories: PresenceMetadata["category"][]
}

export const LibrarySearchBar = ({ query, onQueryChange, category, onCategoryChange, categories }: LibrarySearchBarProps) => {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="sticky top-14 z-10 -mx-4 flex flex-col gap-3 bg-canvas/90 px-4 pt-1 pb-1 backdrop-blur-md">
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={t("library.search")}
        aria-label={t("library.search")}
        leading={<RiSearchLine className="size-4" />}
        trailing={
          query && (
            <button
              type="button"
              aria-label={t("action.clear")}
              onClick={() => (onQueryChange(""), inputRef.current?.focus())}
              className="flex size-6 items-center justify-center text-muted hover:text-ink"
            >
              <RiCloseCircleFill className="size-4" />
            </button>
          )
        }
      />
      <HScroll className="gap-1.5">
        <Chip active={category === "all"} onClick={() => onCategoryChange("all")}>
          {t("library.all")}
        </Chip>
        {categories.map((value) => (
          <Chip key={value} active={category === value} onClick={() => onCategoryChange(category === value ? "all" : value)}>
            {t(categoryKey(value))}
          </Chip>
        ))}
      </HScroll>
    </div>
  )
}
