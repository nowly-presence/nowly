import { useEffect } from "react"
import { PresenceDetailView } from "@/features/activity/presence-detail-view"
import { PresenceList } from "@/features/activity/presence-list"
import type { ExtensionSettings, InstalledPresences, PresenceDisplayMode } from "@/shared/types"

type Props = {
  entries: Array<[string, InstalledPresences[string]]>
  isLoading: boolean
  onOpenWebsite: (slug: string) => void
  onRemove: (slug: string) => void
  onSchedule: (slug: string) => void
  onSelectPresence: (slug: string | null) => void
  onToggle: (slug: string, enabled: boolean) => void
  onUpdatePresence: (slug: string) => void
  selectedSlug: string | null
  settings: ExtensionSettings
  updates: Record<string, string>
  updatingSlug?: string | null
}

// The list/grid toggle is hidden from the UI for now (kept here, and in
// PresenceList's grid branch, in case it comes back) - always resolves to list.
const resolveDisplayMode = (_mode: ExtensionSettings["presenceDisplayMode"]): PresenceDisplayMode => "category"

export const ActivityView = ({
  entries,
  isLoading,
  onOpenWebsite,
  onRemove,
  onSchedule,
  onSelectPresence,
  onToggle,
  onUpdatePresence,
  selectedSlug,
  settings,
  updates,
  updatingSlug,
}: Props): React.JSX.Element => {
  const displayMode = resolveDisplayMode(settings.presenceDisplayMode)
  const selected = selectedSlug ? entries.find(([slug]) => slug === selectedSlug) : undefined

  useEffect(() => {
    if (!selectedSlug || isLoading) return
    if (!selected) onSelectPresence(null)
  }, [isLoading, onSelectPresence, selected, selectedSlug])

  if (selected) {
    const [slug, presence] = selected
    return (
      <PresenceDetailView
        slug={slug}
        presence={presence}
        onBack={() => onSelectPresence(null)}
        onOpenWebsite={onOpenWebsite}
        onRemove={(nextSlug) => {
          onRemove(nextSlug)
          onSelectPresence(null)
        }}
        onSchedule={settings.scheduleEnabled === true ? onSchedule : undefined}
        onToggle={onToggle}
        onUpdatePresence={onUpdatePresence}
        updateAvailable={updates[slug]}
        updating={updatingSlug === slug}
      />
    )
  }

  return (
    <PresenceList
      isLoading={isLoading}
      displayMode={displayMode}
      entries={entries}
      onOpen={onSelectPresence}
      onSchedule={onSchedule}
      onToggle={onToggle}
      onUpdatePresence={onUpdatePresence}
      showSchedule={settings.scheduleEnabled === true}
      updates={updates}
      updatingSlug={updatingSlug}
    />
  )
}
