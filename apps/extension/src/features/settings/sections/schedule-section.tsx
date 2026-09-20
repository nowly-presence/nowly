import { RiCalendarLine } from "@remixicon/react"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { t } from "@/shared/i18n"
import type { ExtensionSettings } from "@/shared/types"
import type { InstalledPresences } from "@/shared/types"
import { Button } from "@/ui/button"
import { Switch } from "@/ui/switch"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  onEditGlobalSchedule: () => void
  onEditPresenceSchedule: (slug: string) => void
  presences: InstalledPresences
  onBack: () => void
}

export const ScheduleSection = ({
  settings,
  onSettingsChange,
  onEditGlobalSchedule,
  onEditPresenceSchedule,
  presences,
  onBack,
}: Props): React.JSX.Element => {
  const scheduledPresences = Object.entries(presences).filter(([, presence]) => presence.schedule)

  return (
    <div className="flex flex-col gap-3">
      <SettingsSectionHeader
        title={t("settings-group-advanced")}
        onBack={onBack}
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <SettingRow
          title={t("schedule-feature")}
          description={t("schedule-feature-description")}
          controlId="schedule-feature-toggle"
          control={
            <Switch
              id="schedule-feature-toggle"
              checked={settings.scheduleEnabled === true}
              onCheckedChange={(checked) => onSettingsChange({ scheduleEnabled: checked })}
            />
          }
        >
          {settings.scheduleEnabled === true ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onEditGlobalSchedule}
                className="mt-1 w-fit"
              >
                <RiCalendarLine />
                {t("schedule-edit-global")}
              </Button>
              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                <p className="text-xs font-semibold text-foreground">{t("schedule")}</p>
                {scheduledPresences.length > 0 ? (
                  scheduledPresences.map(([slug, presence]) => (
                    <Button
                      key={slug}
                      variant="ghost"
                      size="sm"
                      className="justify-between px-2 text-left"
                      onClick={() => onEditPresenceSchedule(slug)}
                    >
                      <span className="truncate">{presence.metadata.name}</span>
                      <span className="text-xs text-muted-foreground">{t("schedule-edit-global")}</span>
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">{t("schedule-feature-description")}</p>
                )}
              </div>
            </>
          ) : null}
        </SettingRow>
      </div>
    </div>
  )
}
