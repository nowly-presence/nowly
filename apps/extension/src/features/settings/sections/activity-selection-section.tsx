import { RiArrowDownSLine as RiDown, RiArrowUpSLine as RiUp } from "@remixicon/react"
import { SettingRow } from "@/features/settings/setting-row"
import { t } from "@/shared/i18n"
import type { ActivitySelectionMode, ExtensionSettings, InstalledPresences } from "@/shared/types"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Button } from "@/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  presences: InstalledPresences
}

export const ActivitySelectionSection = ({ settings, onSettingsChange, presences }: Props): React.JSX.Element => {
  const installedSlugs = Object.keys(presences)
  const priorityOrder = [
    ...(settings.activityPriorityOrder ?? []).filter((slug) => installedSlugs.includes(slug)),
    ...installedSlugs.filter((slug) => !(settings.activityPriorityOrder ?? []).includes(slug)),
  ]

  const movePriority = (slug: string, direction: -1 | 1): void => {
    const index = priorityOrder.indexOf(slug)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= priorityOrder.length) return
    const reordered = [...priorityOrder]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    onSettingsChange({ activityPriorityOrder: reordered })
  }

  return (
    <AccordionItem value="activity-selection">
      <AccordionTrigger className="px-4">{t("settings-group-activity-selection")}</AccordionTrigger>
      <AccordionContent className="pb-0">
        <SettingRow
          title={t("activity-selection-mode")}
          description={t("activity-selection-mode-description")}
          control={
            <Select value={settings.activitySelectionMode ?? "focused"} onValueChange={(value) => onSettingsChange({ activitySelectionMode: value as ActivitySelectionMode })}>
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
                {priorityOrder.map((slug, index) => (
                  <li key={slug} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                    <span className="min-w-0 truncate">{presences[slug]?.metadata.name ?? slug}</span>
                    <span className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={t("activity-priority-move-up")} disabled={index === 0} onClick={() => movePriority(slug, -1)}>
                        <RiUp />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={t("activity-priority-move-down")} disabled={index === priorityOrder.length - 1} onClick={() => movePriority(slug, 1)}>
                        <RiDown />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </SettingRow>
      </AccordionContent>
    </AccordionItem>
  )
}
