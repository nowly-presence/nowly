import { ScreenBody, ScreenTitle } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { Skeleton } from "@/ui/skeleton";
import { CurrentTabSection } from "@/features/activity/current-tab-section";
import { CustomActivitiesSection } from "@/features/activity/custom-activities-section";
import { InstalledPresencesSection } from "@/features/activity/installed-presences-section";
import { LiveActivitySection } from "@/features/activity/live-activity-section";
import { QueuedActivitiesSection } from "@/features/activity/queued-activities-section";
import { SupportCard } from "@/features/activity/support-card";
import { useActivityOverview } from "@/features/activity/use-activity-overview";

export const ActivityView = () => {
  const { state } = useExtensionState();
  const { t } = useI18n();
  const { now, detectedSlugs, sortedPresences, liveTab, otherActivities } = useActivityOverview();

  if (!state.ready) {
    return (
      <ScreenBody>
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-14" />
        <Skeleton className="h-48" />
      </ScreenBody>
    );
  }

  return (
    <ScreenBody>
      <ScreenTitle title={t("activity.pageTitle")} subtitle={t("activity.pageDescription")} />
      <LiveActivitySection liveTab={liveTab} otherActivityCount={otherActivities.length} hasPresences={sortedPresences.length > 0} />
      <CurrentTabSection />
      <QueuedActivitiesSection activities={otherActivities} />
      <InstalledPresencesSection presences={sortedPresences} detectedSlugs={detectedSlugs} now={now} />
      <CustomActivitiesSection />
      <SupportCard />
    </ScreenBody>
  );
};