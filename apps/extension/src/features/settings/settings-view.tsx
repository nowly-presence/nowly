import { ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { useI18n } from "@/hooks/i18n-provider";
import { ConnectionSummary } from "@/features/settings/connection-summary";
import { AboutSection } from "@/features/settings/sections/about-section";
import { AccountSection } from "@/features/settings/sections/account-section";
import { AdvancedSection } from "@/features/settings/sections/advanced-section";
import { AppearanceSection } from "@/features/settings/sections/appearance-section";
import { PrivacySection } from "@/features/settings/sections/privacy-section";
import { ScheduleSection } from "@/features/settings/sections/schedule-section";
import { SharingSection } from "@/features/settings/sections/sharing-section";
import { NavigationSection } from "@/features/settings/sections/navigation-section";

export const SettingsView = () => {
  const { t } = useI18n();
  return (
    <ScreenBody className="[&>section]:snap-start [&>section]:snap-always">
      <div className="flex flex-col gap-6 snap-start snap-always">
        <ScreenTitle title={t("settings.title")} />
        <ConnectionSummary />
      </div>
      <SharingSection />
      <ScheduleSection />
      <AppearanceSection />
      <NavigationSection />
      <AccountSection />
      <PrivacySection />
      <AdvancedSection />
      <AboutSection />
    </ScreenBody>
  );
};
