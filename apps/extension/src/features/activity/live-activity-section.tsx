import { RiEyeOffLine } from "@remixicon/react"
import { LiveCard } from "@/components/shared/live-activity-card"
import { PresenceIcon } from "@/components/shared/presence-icon"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { connectionOf } from "@/lib/presence-status"
import type { TabActivity } from "@/shared/types"
import { Button } from "@/ui/button"
import { Section } from "@/ui/section"
import { IdleCard } from "@/features/activity/idle-activity-card"
import { useTabSharing } from "@/features/activity/use-tab-sharing"

type LiveActivitySectionProps = {
  liveTab: TabActivity | undefined
  otherActivityCount: number
  hasPresences: boolean
}

export const LiveActivitySection = ({ liveTab, otherActivityCount, hasPresences }: LiveActivitySectionProps) => {
  const { state, updateSettings } = useExtensionState()
  const { t } = useI18n()
  const { push } = useNav()
  const setTabMuted = useTabSharing()
  const { activity, presences, settings } = state
  const paused = settings.presencePaused === true
  const liveStored = activity ? presences[activity.slug] : undefined
  const resume = () => void updateSettings({ presencePaused: false })

  return (
    <Section title={t("activity.now")}>
      {activity && liveStored && settings.showPlayer !== false ? (
        <LiveCard
          slug={activity.slug}
          presence={activity.presence}
          presenceName={liveStored.metadata.name}
          t={t}
          status={paused ? "paused" : "live"}
          statusLabel={paused ? t("activity.pausedLabel") : undefined}
          stackDepth={otherActivityCount}
          onOpen={() => push({ name: "presence", slug: activity.slug })}
          footer={
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-label-md text-on-tertiary-muted">
                <PresenceIcon slug={activity.slug} name={liveStored.metadata.name} color={liveStored.metadata.color} size={18} rounded="rounded-[5px]" />
                <span className="truncate">{liveStored.metadata.name}</span>
              </span>
              {paused ? (
                <Button size="sm" variant="inverse" onClick={resume}>
                  {t("action.resume")}
                </Button>
              ) : (
                liveTab && (
                  <button
                    type="button"
                    onClick={() => void setTabMuted(liveTab.tabId, true)}
                    className="flex h-7 items-center gap-1.5 rounded-sm px-2 text-label-md font-medium text-on-tertiary-muted transition-colors hover:bg-tertiary-line hover:text-on-tertiary"
                  >
                    <RiEyeOffLine className="size-3.5" />
                    {t("activity.hideTab")}
                  </button>
                )
              )}
            </div>
          }
        />
      ) : (
        <IdleCard connection={connectionOf(state.native)} paused={paused} onResume={resume} hasPresences={hasPresences} />
      )}
    </Section>
  )
}
