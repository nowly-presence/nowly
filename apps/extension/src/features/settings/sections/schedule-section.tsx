import { RiCalendarLine } from "@remixicon/react"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { t } from "@/shared/i18n"
import type { ExtensionSettings } from "@/shared/types"
import { Button } from "@/ui/button"
import { Switch } from "@/ui/switch"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  onEditGlobalSchedule: () => void
  onBack: () => void
}

export const ScheduleSection = ({ settings, onSettingsChange, onEditGlobalSchedule, onBack }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <SettingsSectionHeader title={t("settings-group-schedule")} onBack={onBack} />
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <SettingRow
        title={t("schedule-feature")}
        description={t("schedule-feature-description")}
        control={<Switch checked={settings.scheduleEnabled === true} onCheckedChange={(checked) => onSettingsChange({ scheduleEnabled: checked })} />}
      >
        {settings.scheduleEnabled === true ? (
          <Button variant="outline" size="sm" onClick={onEditGlobalSchedule} className="mt-1 w-fit">
            <RiCalendarLine />
            {t("schedule-edit-global")}
          </Button>
        ) : null}
      </SettingRow>
    </div>
  </div>
)
