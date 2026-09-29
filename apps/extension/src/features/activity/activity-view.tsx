import { ScreenBody } from "@/components/shared/screen"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { Skeleton } from "@/ui/skeleton"
import { CurrentTabSection } from "@/features/activity/current-tab-section"
import { InstalledPresencesSection } from "@/features/activity/installed-presences-section"
import { LiveActivitySection } from "@/features/activity/live-activity-section"
import { QueuedActivitiesSection } from "@/features/activity/queued-activities-section"
import { useActivityOverview } from "@/features/activity/use-activity-overview"

export const ActivityView = () => {
  const { state } = useExtensionState()
  const { now, detectedSlugs, sortedPresences, liveTab, otherActivities } = useActivityOverview()

  if (!state.ready) {
    return (
      <ScreenBody>
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-14" />
        <Skeleton className="h-48" />
      </ScreenBody>
    )
  }

  return (
    <ScreenBody>
      <LiveActivitySection liveTab={liveTab} otherActivityCount={otherActivities.length} hasPresences={sortedPresences.length > 0} />
      <CurrentTabSection />
      <QueuedActivitiesSection activities={otherActivities} />
      <InstalledPresencesSection presences={sortedPresences} detectedSlugs={detectedSlugs} now={now} />
    </ScreenBody>
  )
}
