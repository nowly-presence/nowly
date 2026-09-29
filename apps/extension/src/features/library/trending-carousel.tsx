import { RiCheckLine } from "@remixicon/react"
import { PresenceIcon } from "@/components/shared/presence-icon"
import { PresenceThumbnail } from "@/components/shared/presence-thumbnail"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { formatCompact } from "@/lib/format"
import { categoryKey } from "@/lib/presence-categories"
import type { PresenceView } from "@/lib/presence-view"
import { HScroll } from "@/ui/horizontal-scroller"
import { LiveDot } from "@/ui/live-dot"
import { Section } from "@/ui/section"

export const TrendingCarousel = ({ views }: { views: PresenceView[] }) => {
  const { state } = useExtensionState()
  const { t, locale } = useI18n()
  const { push } = useNav()

  if (views.length === 0) return null

  return (
    <Section title={t("library.trending")}>
      <HScroll snap className="gap-3">
        {views.map((view) => (
          <button
            key={view.slug}
            type="button"
            onClick={() => push({ name: "presence", slug: view.slug })}
            className="group relative flex w-[78%] max-w-72 shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-tertiary-edge bg-tertiary text-left text-on-tertiary"
          >
            <PresenceThumbnail slug={view.slug} color={view.color} className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-gradient-to-t from-tertiary via-tertiary/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 p-3">
              <PresenceIcon slug={view.slug} name={view.name} color={view.color} size={32} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-label-lg font-medium">{view.name}</span>
                <span className="flex items-center gap-1.5 text-label-md text-on-tertiary-muted">
                  {(view.activeUsers ?? 0) > 0 ? (
                    <>
                      <LiveDot pulse={false} />
                      {t("library.usersNow", { count: formatCompact(view.activeUsers, locale) })}
                    </>
                  ) : (
                    t(categoryKey(view.category))
                  )}
                </span>
              </span>
              {state.presences[view.slug] && <RiCheckLine className="size-4 text-tertiary-accent" />}
            </div>
          </button>
        ))}
      </HScroll>
    </Section>
  )
}
