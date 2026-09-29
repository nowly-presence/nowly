import { RiTimeLine } from "@remixicon/react"
import { DEFAULT_SCHEDULE, ScheduleEditor } from "@/components/shared/schedule-editor"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { usePresenceActions } from "@/hooks/use-presence-actions"
import type { StoredPresence } from "@/shared/types"
import { Group } from "@/ui/card"
import { SwitchRow } from "@/ui/row"
import { Section } from "@/ui/section"

export const PresenceScheduleSection = ({ slug, stored }: { slug: string; stored: StoredPresence }) => {
  const { state, updateSettings } = useExtensionState()
  const { t } = useI18n()
  const actions = usePresenceActions()

  const toggleSchedule = (enabled: boolean) => {
    void actions.setSchedule(slug, enabled ? (state.settings.globalSchedule ?? DEFAULT_SCHEDULE) : undefined)
    if (enabled && state.settings.scheduleEnabled !== true) void updateSettings({ scheduleEnabled: true })
  }

  return (
    <Section title={t("detail.schedule")}>
      <Group>
        <SwitchRow
          leading={<RiTimeLine className="size-[18px] text-muted" />}
          title={t("detail.customSchedule")}
          description={stored.schedule ? t("detail.customScheduleOn") : t("detail.customScheduleOff")}
          checked={Boolean(stored.schedule)}
          label={t("detail.customSchedule")}
          onChange={toggleSchedule}
        />
        {stored.schedule && (
          <div className="px-4 py-3">
            <ScheduleEditor value={stored.schedule} onChange={(schedule) => void actions.setSchedule(slug, schedule)} />
          </div>
        )}
      </Group>
    </Section>
  )
}
