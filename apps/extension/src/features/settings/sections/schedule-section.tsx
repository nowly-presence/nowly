import { DEFAULT_SCHEDULE, ScheduleEditor } from "@/components/shared/schedule-editor"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { Group } from "@/ui/card"
import { SwitchRow } from "@/ui/row"
import { Section } from "@/ui/section"

export const ScheduleSection = () => {
  const { state, updateSettings } = useExtensionState()
  const { t } = useI18n()
  const { scheduleEnabled, globalSchedule } = state.settings

  return (
    <Section title={t("settings.schedule")}>
      <Group>
        <SwitchRow
          title={t("settings.scheduleToggle")}
          description={t("settings.scheduleHint")}
          checked={scheduleEnabled === true}
          label={t("settings.scheduleToggle")}
          onChange={(checked) => void updateSettings({ scheduleEnabled: checked, ...(checked && !globalSchedule ? { globalSchedule: DEFAULT_SCHEDULE } : {}) })}
        />
        {scheduleEnabled === true && (
          <div className="px-4 py-3">
            <ScheduleEditor value={globalSchedule ?? DEFAULT_SCHEDULE} onChange={(schedule) => void updateSettings({ globalSchedule: schedule })} />
          </div>
        )}
      </Group>
    </Section>
  )
}
