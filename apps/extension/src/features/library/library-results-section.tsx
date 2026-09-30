import { RiDiscordLine, RiSearchLine } from "@remixicon/react"
import { SeasonalDecor } from "@/components/shared/seasonal-decor"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { usePresenceActions } from "@/hooks/use-presence-actions"
import { categoryKey } from "@/lib/presence-categories"
import type { PresenceView } from "@/lib/presence-view"
import { openUrl } from "@/shared/browser-links"
import { DISCORD_INVITE_URL } from "@/shared/constants"
import { Button } from "@/ui/button"
import { Card, Group } from "@/ui/card"
import { EmptyState } from "@/ui/empty-state"
import { Section } from "@/ui/section"
import { Segmented } from "@/ui/segmented"
import type { LibraryCategory, LibrarySort } from "@/features/library/library-catalog"
import { LibraryPresenceRow } from "@/features/library/library-presence-row"

type LibraryResultsSectionProps = {
  results: PresenceView[]
  newSlugs: Set<string>
  browsing: boolean
  query: string
  category: LibraryCategory
  sort: LibrarySort
  onSortChange: (sort: LibrarySort) => void
}

export const LibraryResultsSection = ({ results, newSlugs, browsing, query, category, sort, onSortChange }: LibraryResultsSectionProps) => {
  const { state } = useExtensionState()
  const { t } = useI18n()
  const { push } = useNav()
  const actions = usePresenceActions()

  return (
    <Section
      title={browsing ? t("library.allPresences") : t("library.results", { count: results.length })}
      action={
        <Segmented
          label={t("library.sort")}
          value={sort}
          onChange={onSortChange}
          className="w-auto"
          options={[
            { value: "popular", label: t("library.sortPopular") },
            { value: "new", label: t("library.sortNew") },
            { value: "name", label: t("library.sortName") },
          ]}
        />
      }
    >
      {results.length === 0 ? (
        <Card>
          <EmptyState
            decoration={<SeasonalDecor />}
            icon={<RiSearchLine className="size-5" />}
            title={t("library.noResults", { query: query.trim() || t(categoryKey(category === "all" ? "other" : category)) })}
            description={t("library.noResultsDescription")}
            action={
              <Button variant="secondary" icon={<RiDiscordLine className="size-4" />} onClick={() => openUrl(DISCORD_INVITE_URL)}>
                {t("library.request")}
              </Button>
            }
          />
        </Card>
      ) : (
        <Group>
          {results.map((view) => (
            <LibraryPresenceRow
              key={view.slug}
              view={view}
              isNew={newSlugs.has(view.slug)}
              installed={Boolean(state.presences[view.slug])}
              installing={actions.pending === view.slug}
              showPublishedDate={sort === "new"}
              onOpen={() => push({ name: "presence", slug: view.slug })}
              onInstall={() => void actions.install(view.slug, view.name)}
            />
          ))}
        </Group>
      )}
    </Section>
  )
}
