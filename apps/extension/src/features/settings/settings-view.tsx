import { ScreenBody, ScreenTitle } from "@/components/shared/screen"
import { useI18n } from "@/hooks/i18n-provider"
import { ConnectionSummary } from "@/features/settings/connection-summary"
import { AboutSection } from "@/features/settings/sections/about-section"
import { AccountSection } from "@/features/settings/sections/account-section"
import { AdvancedSection } from "@/features/settings/sections/advanced-section"
import { AppearanceSection } from "@/features/settings/sections/appearance-section"
import { PrivacySection } from "@/features/settings/sections/privacy-section"
import { ScheduleSection } from "@/features/settings/sections/schedule-section"
import { SharingSection } from "@/features/settings/sections/sharing-section"

export const SettingsView = () => {
  const { t } = useI18n()
  return (
    <ScreenBody>
      <ScreenTitle title={t("settings.title")} />
      <ConnectionSummary />
      <SharingSection />
      <ScheduleSection />
      <AppearanceSection />
      <AccountSection />
      <PrivacySection />
      <AdvancedSection />
      <AboutSection />
    </ScreenBody>
  )
}
