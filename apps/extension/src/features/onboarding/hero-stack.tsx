import { useMemo } from "react"
import type { PresencePayload } from "@/shared/types"
import { LiveCard } from "@/components/shared/live-activity-card"
import type { Translate } from "@/hooks/i18n-provider"
import type { PresenceView } from "@/lib/presence-view"

type Sample = { view: PresenceView; presence: PresencePayload }

const fallbackView = (slug: string, name: string, category: PresenceView["category"], color: string): PresenceView => ({
  slug,
  name,
  category,
  color,
  description: "",
  longDescription: "",
  features: [],
  contributors: [],
  urls: [],
  addedAt: null,
  lastUpdated: null,
})

const FALLBACK_VIEWS = [
  fallbackView("__sample-music", "Music", "music", "#4a5560"),
  fallbackView("__sample-design", "Design", "tools", "#07080c"),
  fallbackView("__sample-video", "Video", "video", "#0891b2"),
]

export const HeroStack = ({ views: catalogViews, t }: { views: PresenceView[]; t: Translate }) => {
  const now = useMemo(() => Math.floor(Date.now() / 1000), [])
  const views = catalogViews.length > 0 ? catalogViews : FALLBACK_VIEWS

  const samples: Sample[] = useMemo(() => {
    const byCategory = (categories: PresenceView["category"][]) => views.find((view) => categories.includes(view.category))
    const picks: { view: PresenceView | undefined; presence: PresencePayload }[] = [
      { view: byCategory(["music"]), presence: { details: t("onboarding.heroMusicDetails"), state: t("onboarding.heroMusicState"), type: 2, startTime: now - 96, endTime: now + 131 } },
      { view: byCategory(["tools", "creator", "ai", "learning"]), presence: { details: t("onboarding.sampleDetails"), state: t("onboarding.sampleState"), type: 0, startTime: now - 1954 } },
      { view: byCategory(["streaming", "video"]), presence: { details: t("onboarding.heroVideoDetails"), state: t("onboarding.heroVideoState"), type: 3, startTime: now - 262, endTime: now + 311 } },
    ]
    return picks.flatMap((pick) => (pick.view ? [{ view: pick.view, presence: { ...pick.presence, name: pick.view.name } }] : []))
  }, [views, t, now])

  const layers = samples.length
  return (
    <div className="relative" style={{ paddingTop: (layers - 1) * 26 }}>
      {samples.map((sample, index) => {
        const depth = layers - 1 - index
        return (
          <div
            key={sample.view.slug}
            className={depth === 0 ? "relative" : "pointer-events-none absolute inset-x-0 top-0 rounded-lg bg-canvas"}
            style={
              depth === 0
                ? undefined
                : { transform: `translateY(${(layers - 1 - depth) * 26}px) scale(${1 - depth * 0.06})`, transformOrigin: "top center" }
            }
          >
            <div style={depth === 0 ? undefined : { opacity: depth === 1 ? 0.72 : 0.42, filter: depth > 1 ? "blur(0.6px)" : undefined }}>
              <LiveCard slug={sample.view.slug} presenceName={sample.view.name} presence={sample.presence} t={t} compact={depth > 0} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
