import { PresenceIcon } from "@/components/shared/presence-icon"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { keyboardShortcuts } from "@/lib/keyboard-shortcuts"
import type { ActivitySelectionMode } from "@/shared/types"
import { Group } from "@/ui/card"
import { FieldRow } from "@/ui/field-row"
import { SwitchRow } from "@/ui/row"
import { Section } from "@/ui/section"
import { Segmented } from "@/ui/segmented"
import { SortableList } from "@/ui/sortable-list"

export const SharingSection = () => {
  const { state, updateSettings } = useExtensionState()
  const { t } = useI18n()
  const { settings, presences } = state
  const savedOrder = settings.activityPriorityOrder ?? []
  const priority = [...savedOrder.filter((slug) => presences[slug]), ...Object.keys(presences).filter((slug) => !savedOrder.includes(slug))]

  return (
    <Section title={t("settings.sharing")}>
      <Group>
        <SwitchRow
          title={t("settings.pause")}
          description={t("settings.pauseHint", { shortcut: keyboardShortcuts().togglePause })}
          checked={settings.presencePaused === true}
          label={t("settings.pause")}
          onChange={(checked) => void updateSettings({ presencePaused: checked })}
        />
        <SwitchRow
          title={t("settings.showPlayer")}
          description={t("settings.showPlayerHint")}
          checked={settings.showPlayer !== false}
          label={t("settings.showPlayer")}
          onChange={(checked) => void updateSettings({ showPlayer: checked })}
        />
        <SwitchRow
          title={t("settings.suggestPresences")}
          description={t("settings.suggestPresencesHint")}
          checked={settings.suggestPresences !== false}
          label={t("settings.suggestPresences")}
          onChange={(checked) => void updateSettings({ suggestPresences: checked })}
        />
        <FieldRow title={t("settings.selection")} description={t("settings.selectionHint")} layout="stacked" spacing="relaxed" controlClassName="flex flex-col gap-3">
          <Segmented<ActivitySelectionMode>
            label={t("settings.selection")}
            value={settings.activitySelectionMode ?? "focused"}
            onChange={(value) => void updateSettings({ activitySelectionMode: value })}
            options={[
              { value: "focused", label: t("settings.selectionFocused") },
              { value: "priority", label: t("settings.selectionPriority") },
            ]}
          />
          {settings.activitySelectionMode === "priority" && priority.length > 0 && (
            <div className="flex flex-col gap-2">
              <SortableList
                label={t("settings.selectionPriority")}
                items={priority}
                getKey={(slug) => slug}
                itemLabel={(slug) => presences[slug].metadata.name}
                onReorder={(next) => void updateSettings({ activityPriorityOrder: next })}
                renderItem={(slug) => (
                  <>
                    <PresenceIcon slug={slug} name={presences[slug].metadata.name} color={presences[slug].metadata.color} size={22} rounded="rounded-[6px]" />
                    <span className="min-w-0 flex-1 truncate text-label-md font-medium">{presences[slug].metadata.name}</span>
                  </>
                )}
              />
              <span className="text-label-sm text-muted">{t("settings.dragHint")}</span>
            </div>
          )}
        </FieldRow>
      </Group>
    </Section>
  )
}
