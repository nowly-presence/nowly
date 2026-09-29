import { RiApps2AddLine, RiFunctionLine, RiListCheck } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { usePresenceActions } from "@/hooks/use-presence-actions"
import { presenceStatus } from "@/lib/presence-status"
import type { StoredPresence } from "@/shared/types"
import { Button } from "@/ui/button"
import { Card, Group } from "@/ui/card"
import { EmptyState } from "@/ui/empty-state"
import { Section } from "@/ui/section"
import { PresenceGridCard } from "@/features/activity/presence-grid-card"
import { PresenceListRow } from "@/features/activity/presence-list-row"
import { statusText } from "@/features/activity/presence-status-text"

type InstalledPresencesSectionProps = {
  presences: [string, StoredPresence][]
  detectedSlugs: Set<string>
  now: number
}

export const InstalledPresencesSection = ({ presences, detectedSlugs, now }: InstalledPresencesSectionProps) => {
  const { state, updateSettings } = useExtensionState()
  const { t, locale } = useI18n()
  const { push, setTab } = useNav()
  const actions = usePresenceActions()
  const grid = state.settings.presenceDisplayMode === "grid"
  const viewLabel = grid ? t("activity.viewList") : t("activity.viewGrid")

  const describe = (slug: string, stored: StoredPresence) => {
    const status = presenceStatus(slug, stored, state.settings, { liveSlug: state.activity?.slug, detectedSlugs, now })
    return { status, line: statusText(status, stored, t, locale) }
  }

  return (
    <Section
      title={presences.length ? t("activity.yourPresences", { count: presences.length }) : t("activity.yourPresencesEmpty")}
      action={
        presences.length > 0 && (
          <button
            type="button"
            onClick={() => void updateSettings({ presenceDisplayMode: grid ? "category" : "grid" })}
            aria-label={viewLabel}
            title={viewLabel}
            className="flex size-7 items-center justify-center rounded-sm text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            {grid ? <RiListCheck className="size-4" /> : <RiFunctionLine className="size-4" />}
          </button>
        )
      }
    >
      {presences.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RiApps2AddLine className="size-5" />}
            title={t("activity.emptyTitle")}
            description={t("activity.emptyDescription")}
            action={
              <Button onClick={() => setTab("store")} icon={<RiApps2AddLine className="size-4" />}>
                {t("activity.browseLibrary")}
              </Button>
            }
          />
        </Card>
      ) : grid ? (
        <div className="grid grid-cols-2 gap-2">
          {presences.map(([slug, stored]) => (
            <PresenceGridCard
              key={slug}
              slug={slug}
              stored={stored}
              {...describe(slug, stored)}
              onOpen={() => push({ name: "presence", slug })}
              onToggle={(enabled) => void actions.toggle(slug, enabled)}
            />
          ))}
        </div>
      ) : (
        <Group>
          {presences.map(([slug, stored]) => (
            <PresenceListRow
              key={slug}
              slug={slug}
              stored={stored}
              {...describe(slug, stored)}
              hasUpdate={Boolean(state.updates[slug])}
              onOpen={() => push({ name: "presence", slug })}
              onToggle={(enabled) => void actions.toggle(slug, enabled)}
            />
          ))}
        </Group>
      )}
    </Section>
  )
}
