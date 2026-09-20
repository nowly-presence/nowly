import { RiExternalLinkLine } from "@remixicon/react"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { WEB_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import { Switch } from "@/ui/switch"

type Props = {
  analyticsConsent: boolean
  onAnalyticsConsentChange: (granted: boolean) => void
  onBack: () => void
}

export const PrivacySection = ({ analyticsConsent, onAnalyticsConsentChange, onBack }: Props): React.JSX.Element => (
  <div className="flex flex-col gap-3">
    <SettingsSectionHeader title={t("settings-group-privacy")} onBack={onBack} />
    <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
      <SettingRow
        title={t("analytics-consent")}
        description={t("analytics-consent-description")}
        controlId="analytics-consent-toggle"
        control={<Switch id="analytics-consent-toggle" checked={analyticsConsent} onCheckedChange={onAnalyticsConsentChange} />}
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
