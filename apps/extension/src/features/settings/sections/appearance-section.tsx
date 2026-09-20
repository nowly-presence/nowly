import { RiComputerLine, RiGlobalLine, RiMoonLine, RiSunLine } from "@remixicon/react"
import { LocaleFlag } from "@/components/shared/locale-flag"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { t, type LocalePreference } from "@/shared/i18n"
import type { AppearanceMode, ExtensionSettings } from "@/shared/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"
import { Switch } from "@/ui/switch"

type Props = {
  localePreference: LocalePreference
  onLocaleChange: (preference: LocalePreference) => void
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  onBack: () => void
}

export const AppearanceSection = ({ localePreference, onLocaleChange, settings, onSettingsChange, onBack }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <SettingsSectionHeader title={t("settings-group-appearance")} onBack={onBack} />
    <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
      <SettingRow
        title={t("language")}
        description={t("language-description")}
        control={
          <Select
            value={localePreference}
            onValueChange={(value) => onLocaleChange(value as LocalePreference)}
            items={{ browser: t("locale-auto"), fr: t("locale-fr"), en: t("locale-en"), es: t("locale-es") }}
          >
            <SelectTrigger size="sm" className="w-36" aria-label={t("language")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="browser">
                <RiGlobalLine className="size-4 text-muted-foreground" />
                {t("locale-auto")}
              </SelectItem>
              <SelectItem value="fr">
                <LocaleFlag locale="fr-FR" />
                {t("locale-fr")}
              </SelectItem>
              <SelectItem value="en">
                <LocaleFlag locale="en-US" />
                {t("locale-en")}
              </SelectItem>
              <SelectItem value="es">
                <LocaleFlag locale="es-ES" />
                {t("locale-es")}
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SettingRow
        title={t("appearance")}
        description={t("appearance-description")}
        control={
          <Select
            value={settings.appearance ?? "system"}
            onValueChange={(value) => onSettingsChange({ appearance: value as AppearanceMode })}
            items={{ system: t("appearance-system"), light: t("appearance-light"), dark: t("appearance-dark") }}
          >
            <SelectTrigger size="sm" className="w-36" aria-label={t("appearance")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                <RiComputerLine className="size-4 text-muted-foreground" />
                {t("appearance-system")}
              </SelectItem>
              <SelectItem value="light">
                <RiSunLine className="size-4 text-muted-foreground" />
                {t("appearance-light")}
              </SelectItem>
              <SelectItem value="dark">
                <RiMoonLine className="size-4 text-muted-foreground" />
                {t("appearance-dark")}
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SettingRow
        title={t("bg-animation")}
        description={t("bg-animation-description")}
        control={<Switch checked={settings.backgroundAnimation !== false} onCheckedChange={(checked) => onSettingsChange({ backgroundAnimation: checked })} />}
      />
    </div>
  </div>
)
