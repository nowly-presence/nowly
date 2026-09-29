import { useEffect, useMemo } from "react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { fromCatalog, fromMetadata, type PresenceView } from "@/lib/presence-view"
import { publicationDates } from "@/shared/presence-dates"

export const usePresenceDetails = (slug: string) => {
  const { state, refresh } = useExtensionState()
  const { locale } = useI18n()
  const stored = state.presences[slug]
  const catalogItem = state.catalog.items.find((item) => item.slug === slug)

  useEffect(() => {
    if (!stored) void refresh.catalog()
  }, [stored, refresh])

  const view = useMemo<PresenceView | null>(() => {
    if (stored) {
      const dates = catalogItem ? publicationDates(catalogItem) : publicationDates(stored.release ?? {})
      const base = fromMetadata(stored.release?.metadata ?? stored.metadata, locale, dates)
      return catalogItem ? { ...base, totalInstalls: catalogItem.totalInstalls, activeUsers: catalogItem.activeUsers } : base
    }
    return catalogItem ? fromCatalog(catalogItem, locale) : null
  }, [stored, catalogItem, locale])

  return { stored, view }
}
