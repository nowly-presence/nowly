import { RiDraggable } from "@remixicon/react"
import { useState } from "react"
import { PresenceTile } from "@/components/shared/presence-tile"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { t } from "@/shared/i18n"
import type { ActivitySelectionMode, ExtensionSettings, InstalledPresences } from "@/shared/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { cn } from "@/ui/utils"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  presences: InstalledPresences
  onBack: () => void
}

export const ActivitySelectionSection = ({ settings, onSettingsChange, presences, onBack }: Props): React.JSX.Element => {
  const installedSlugs = Object.keys(presences)
  const priorityOrder = [
    ...(settings.activityPriorityOrder ?? []).filter((slug) => installedSlugs.includes(slug)),
    ...installedSlugs.filter((slug) => !(settings.activityPriorityOrder ?? []).includes(slug)),
  ]

  const [draggedSlug, setDraggedSlug] = useState<string | null>(null)

  // Native HTML5 drag-and-drop - desktop-only side panel, so no touch
  // fallback needed, and it's one small reorder list, not worth a DnD library.
  const reorder = (draggedOver: string): void => {
    if (!draggedSlug || draggedSlug === draggedOver) return
    const from = priorityOrder.indexOf(draggedSlug)
    const to = priorityOrder.indexOf(draggedOver)
    if (from === -1 || to === -1) return
    const reordered = [...priorityOrder]
    reordered.splice(from, 1)
    reordered.splice(to, 0, draggedSlug)
    onSettingsChange({ activityPriorityOrder: reordered })
  }

  return (
    <div className="flex flex-col gap-3">
      <SettingsSectionHeader title={t("settings-group-activity-selection")} onBack={onBack} />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <SettingRow
          title={t("activity-selection-mode")}
          description={t("activity-selection-mode-description")}
          control={
            <Select
              value={settings.activitySelectionMode ?? "focused"}
              onValueChange={(value) => onSettingsChange({ activitySelectionMode: value as ActivitySelectionMode })}
              items={{ focused: t("activity-selection-mode-focused"), priority: t("activity-selection-mode-priority") }}
            >
              <SelectTrigger size="sm" className="w-40" aria-label={t("activity-selection-mode")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="focused">{t("activity-selection-mode-focused")}</SelectItem>
                <SelectItem value="priority">{t("activity-selection-mode-priority")}</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          {settings.activitySelectionMode === "priority" && installedSlugs.length > 0 ? (
            <div className="mt-1">
              <p className="mb-2 text-xs leading-5 text-muted-foreground">{t("activity-priority-order-description")}</p>
              <ul className="flex flex-col gap-1.5">
                {priorityOrder.map((slug) => {
                  const name = presences[slug]?.metadata.name ?? slug
                  return (
                    <li
                      key={slug}
                      draggable
                      onDragStart={(event) => {
                        setDraggedSlug(slug)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        reorder(slug)
                      }}
                      onDragEnd={() => setDraggedSlug(null)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 transition-opacity",
                        draggedSlug === slug && "opacity-50",
                      )}
                    >
                      <RiDraggable className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" aria-hidden />
                      <PresenceTile slug={slug} name={name} className="size-8" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{name}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </SettingRow>
      </div>
    </div>
  )
}
