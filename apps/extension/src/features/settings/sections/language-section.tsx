import { RiGlobalLine } from "@remixicon/react"
import { LocaleFlag } from "@/components/shared/locale-flag"
import { SettingRow } from "@/features/settings/setting-row"
import { t } from "@/shared/i18n"
import type { ExtensionSettings, PresenceLanguageMode } from "@/shared/types"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
}

export const LanguageSection = ({ settings, onSettingsChange }: Props): React.JSX.Element => (
  <AccordionItem value="presence-language">
    <AccordionTrigger className="px-4">{t("settings-group-presence-language")}</AccordionTrigger>
    <AccordionContent className="pb-0">
      <SettingRow
        title={t("presence-language")}
        description={t("presence-language-description")}
        control={
          <Select value={settings.presenceLanguage ?? "per-presence"} onValueChange={(value) => onSettingsChange({ presenceLanguage: value as PresenceLanguageMode })}>
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
    </AccordionContent>
  </AccordionItem>
)
