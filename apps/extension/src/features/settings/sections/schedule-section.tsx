import { RiCalendarLine } from "@remixicon/react"
import { SettingRow } from "@/features/settings/setting-row"
import { t } from "@/shared/i18n"
import type { ExtensionSettings } from "@/shared/types"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Button } from "@/ui/button"
import { Switch } from "@/ui/switch"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  onEditGlobalSchedule: () => void
}

export const ScheduleSection = ({ settings, onSettingsChange, onEditGlobalSchedule }: Props): React.JSX.Element => (
  <AccordionItem value="schedule">
    <AccordionTrigger className="px-4">{t("settings-group-schedule")}</AccordionTrigger>
    <AccordionContent className="pb-0">
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
    </AccordionContent>
  </AccordionItem>
)
