import { RiGlobalLine } from "@remixicon/react"
import { LocaleFlag } from "@/components/shared/locale-flag"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { t } from "@/shared/i18n"
import type { ExtensionSettings, PresenceLanguageMode } from "@/shared/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  onBack: () => void
}

export const LanguageSection = ({ settings, onSettingsChange, onBack }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <SettingsSectionHeader title={t("settings-group-presence-language")} onBack={onBack} />
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <SettingRow
        title={t("presence-language")}
        description={t("presence-language-description")}
        control={
          <Select
            value={settings.presenceLanguage ?? "per-presence"}
            onValueChange={(value) => onSettingsChange({ presenceLanguage: value as PresenceLanguageMode })}
            items={{ "per-presence": t("presence-language-per-presence"), "en-US": t("locale-en"), "fr-FR": t("locale-fr"), "es-ES": t("locale-es") }}
          >
            <SelectTrigger size="sm" className="w-40" aria-label={t("presence-language")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per-presence">
                <RiGlobalLine className="size-4 text-muted-foreground" />
                {t("presence-language-per-presence")}
              </SelectItem>
              <SelectItem value="en-US">
                <LocaleFlag locale="en-US" />
                {t("locale-en")}
              </SelectItem>
              <SelectItem value="fr-FR">
                <LocaleFlag locale="fr-FR" />
                {t("locale-fr")}
              </SelectItem>
              <SelectItem value="es-ES">
                <LocaleFlag locale="es-ES" />
                {t("locale-es")}
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  </div>
)
