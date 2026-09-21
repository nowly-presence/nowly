import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { ShortcutSettings } from "@/features/settings/shortcut-settings"
import { t } from "@/shared/i18n"
import type { ExtensionSettings } from "@/shared/types"
import { Switch } from "@/ui/switch"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  onBack: () => void
}

export const GeneralSection = ({ settings, onSettingsChange, onBack }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <SettingsSectionHeader
      title={t("settings-group-general")}
      onBack={onBack}
    />
    <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
      <SettingRow
        title={t("presence-pause")}
        description={t("presence-pause-description")}
        controlId="presence-pause-toggle"
        control={
          <Switch
            id="presence-pause-toggle"
            checked={settings.presencePaused === true}
            onCheckedChange={(checked) => onSettingsChange({ presencePaused: checked })}
          />
        }
      />

      <ShortcutSettings />
    </div>
  </div>
)
