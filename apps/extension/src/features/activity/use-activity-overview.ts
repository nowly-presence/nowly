import { useMemo } from "react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useNow } from "@/hooks/use-now"
import { presenceStatus } from "@/lib/presence-status"
import type { StoredPresence } from "@/shared/types"

const STATUS_REFRESH_MS = 30_000

export const useActivityOverview = () => {
  const { state } = useExtensionState()
  const now = useNow(STATUS_REFRESH_MS)
  const { presences, settings, activity, tab } = state

  const detectedSlugs = useMemo(() => new Set(tab.activities.map((entry) => entry.slug)), [tab.activities])

  const sortedPresences = useMemo(() => {
    const rank = (slug: string, stored: StoredPresence) => {
      const kind = presenceStatus(slug, stored, settings, { liveSlug: activity?.slug, detectedSlugs, now }).kind
      if (kind === "live") return 0
      if (kind === "detected") return 1
      return stored.enabled ? 2 : 3
    }
    return Object.entries(presences).sort(([a, sa], [b, sb]) => rank(a, sa) - rank(b, sb) || sa.metadata.name.localeCompare(sb.metadata.name))
  }, [presences, settings, activity?.slug, detectedSlugs, now])

  const liveTab = activity
    ? tab.activities.filter((entry) => entry.slug === activity.slug).sort((a, b) => b.updatedAt - a.updatedAt)[0]
    : undefined

  return {
    now,
    detectedSlugs,
    sortedPresences,
    liveTab,
    otherActivities: tab.activities.filter((entry) => entry.tabId !== liveTab?.tabId),
  }
}
