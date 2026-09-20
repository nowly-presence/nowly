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
        controlId="language-select"
        control={
          <Select
            value={localePreference}
            onValueChange={(value) => onLocaleChange(value as LocalePreference)}
            items={{
              browser: (
                <>
                  <RiGlobalLine className="size-4 text-muted-foreground" />
                  {t("locale-auto")}
                </>
              ),
              fr: (
                <>
                  <LocaleFlag locale="fr-FR" />
                  {t("locale-fr")}
                </>
              ),
              en: (
                <>
                  <LocaleFlag locale="en-US" />
                  {t("locale-en")}
                </>
              ),
              es: (
                <>
                  <LocaleFlag locale="es-ES" />
                  {t("locale-es")}
                </>
              ),
              de: (
                <>
                  <LocaleFlag locale="de-DE" />
                  {t("locale-de")}
                </>
              ),
              "pt-BR": (
                <>
                  <LocaleFlag locale="pt-BR" />
                  {t("locale-pt-br")}
                </>
              ),
              pl: (
                <>
                  <LocaleFlag locale="pl-PL" />
                  {t("locale-pl")}
                </>
              ),
              ja: (
                <>
                  <LocaleFlag locale="ja-JP" />
                  {t("locale-ja")}
                </>
              ),
              ko: (
                <>
                  <LocaleFlag locale="ko-KR" />
                  {t("locale-ko")}
                </>
              ),
              tr: (
                <>
                  <LocaleFlag locale="tr-TR" />
                  {t("locale-tr")}
                </>
              ),
              ms: (
                <>
                  <LocaleFlag locale="ms-MY" />
                  {t("locale-ms")}
                </>
              ),
              el: (
                <>
                  <LocaleFlag locale="el-GR" />
                  {t("locale-el")}
                </>
              ),
            }}
          >
            <SelectTrigger id="language-select" size="sm" className="w-36" aria-label={t("language")}>
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
              <SelectItem value="de">
                <LocaleFlag locale="de-DE" />
                {t("locale-de")}
              </SelectItem>
              <SelectItem value="pt-BR">
                <LocaleFlag locale="pt-BR" />
                {t("locale-pt-br")}
              </SelectItem>
              <SelectItem value="pl">
                <LocaleFlag locale="pl-PL" />
                {t("locale-pl")}
              </SelectItem>
              <SelectItem value="ja">
                <LocaleFlag locale="ja-JP" />
                {t("locale-ja")}
              </SelectItem>
              <SelectItem value="ko">
                <LocaleFlag locale="ko-KR" />
                {t("locale-ko")}
              </SelectItem>
              <SelectItem value="tr">
                <LocaleFlag locale="tr-TR" />
                {t("locale-tr")}
              </SelectItem>
              <SelectItem value="ms">
                <LocaleFlag locale="ms-MY" />
                {t("locale-ms")}
              </SelectItem>
              <SelectItem value="el">
                <LocaleFlag locale="el-GR" />
                {t("locale-el")}
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SettingRow
        title={t("appearance")}
        description={t("appearance-description")}
        controlId="appearance-select"
        control={
          <Select
            value={settings.appearance ?? "system"}
            onValueChange={(value) => onSettingsChange({ appearance: value as AppearanceMode })}
            items={{
              system: (
                <>
                  <RiComputerLine className="size-4 text-muted-foreground" />
                  {t("appearance-system")}
                </>
              ),
              light: (
                <>
                  <RiSunLine className="size-4 text-muted-foreground" />
                  {t("appearance-light")}
                </>
              ),
              dark: (
                <>
                  <RiMoonLine className="size-4 text-muted-foreground" />
                  {t("appearance-dark")}
                </>
              ),
            }}
          >
            <SelectTrigger id="appearance-select" size="sm" className="w-36" aria-label={t("appearance")}>
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
        controlId="bg-animation-toggle"
        control={<Switch id="bg-animation-toggle" checked={settings.backgroundAnimation !== false} onCheckedChange={(checked) => onSettingsChange({ backgroundAnimation: checked })} />}
      />
    </div>
  </div>
)
