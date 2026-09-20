import { RiExternalLinkLine } from "@remixicon/react"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { ShortcutSettings } from "@/features/settings/shortcut-settings"
import { WEB_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import type { ExtensionSettings } from "@/shared/types"
import { Switch } from "@/ui/switch"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  analyticsConsent: boolean
  onAnalyticsConsentChange: (granted: boolean) => void
  onBack: () => void
}

export const PrivacySection = ({ settings, onSettingsChange, analyticsConsent, onAnalyticsConsentChange, onBack }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <SettingsSectionHeader title={t("settings-group-privacy")} onBack={onBack} />
    <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
      <SettingRow
        title={t("presence-pause")}
        description={t("presence-pause-description")}
        control={<Switch checked={settings.presencePaused === true} onCheckedChange={(checked) => onSettingsChange({ presencePaused: checked })} />}
      />

      <ShortcutSettings />

      <SettingRow
        title={t("analytics-consent")}
        description={t("analytics-consent-description")}
        control={<Switch checked={analyticsConsent} onCheckedChange={onAnalyticsConsentChange} />}
      >
        <a
          href={`${WEB_BASE_URL.replace(/\/$/, "")}/consent`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          {t("analytics-consent-manage")}
          <RiExternalLinkLine className="size-3" />
        </a>
      </SettingRow>
    </div>
  </div>
)
