import { RiExternalLinkLine } from "@remixicon/react"
import { SettingRow } from "@/features/settings/setting-row"
import { ShortcutSettings } from "@/features/settings/shortcut-settings"
import { WEB_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import type { ExtensionSettings } from "@/shared/types"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Switch } from "@/ui/switch"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  analyticsConsent: boolean
  onAnalyticsConsentChange: (granted: boolean) => void
}

export const PrivacySection = ({ settings, onSettingsChange, analyticsConsent, onAnalyticsConsentChange }: Props): React.JSX.Element => (
  <AccordionItem value="privacy">
    <AccordionTrigger className="px-4">{t("settings-group-privacy")}</AccordionTrigger>
    <AccordionContent className="divide-y divide-border pb-0">
      <SettingRow
        title={t("presence-pause")}
        description={t("presence-pause-description")}
        control={<Switch checked={settings.presencePaused === true} onCheckedChange={(checked) => onSettingsChange({ presencePaused: checked })} />}
      />

      <div className="px-4 py-3.5">
        <ShortcutSettings />
      </div>

      <div className="px-4 py-3.5">
        <SettingRow
          title={t("analytics-consent")}
          description={t("analytics-consent-description")}
          control={<Switch checked={analyticsConsent} onCheckedChange={onAnalyticsConsentChange} />}
        />
        <a href={`${WEB_BASE_URL.replace(/\/$/, "")}/consent`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
          {t("analytics-consent-manage")}
          <RiExternalLinkLine className="size-3" />
        </a>
      </div>
    </AccordionContent>
  </AccordionItem>
)
