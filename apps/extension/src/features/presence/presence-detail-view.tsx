import { useState } from "react"
import { RiDeleteBinLine, RiExternalLinkLine, RiFlagLine } from "@remixicon/react"
import { LiveCard } from "@/components/shared/live-activity-card"
import { BackHeader, ScreenBody } from "@/components/shared/screen"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { usePresenceActions } from "@/hooks/use-presence-actions"
import { openUrl, siteUrl } from "@/shared/browser-links"
import { Button } from "@/ui/button"
import { Card } from "@/ui/card"
import { EmptyState } from "@/ui/empty-state"
import { Section } from "@/ui/section"
import { Skeleton } from "@/ui/skeleton"
import { PresenceAboutSection } from "@/features/presence/presence-about-section"
import { PresenceHero } from "@/features/presence/presence-hero"
import { PresenceInfoSection } from "@/features/presence/presence-info-section"
import { PresenceLikeButton } from "@/features/presence/presence-like-button"
import { PresencePrimaryActions } from "@/features/presence/presence-primary-actions"
import { PresenceReportSheet } from "@/features/presence/presence-report-sheet"
import { PresenceScheduleSection } from "@/features/presence/presence-schedule-section"
import { PresenceSettingsSection } from "@/features/presence/presence-settings-section"
import { PresenceSnoozeSection } from "@/features/presence/presence-snooze-section"
import { PresenceStats } from "@/features/presence/presence-stats"
import { PresenceUninstallSheet } from "@/features/presence/presence-uninstall-sheet"
import { usePresenceDetails } from "@/features/presence/use-presence-details"
import { usePresenceEngagement } from "@/features/presence/use-presence-engagement"

export const PresenceDetailView = ({ slug }: { slug: string }) => {
  const { state, refresh } = useExtensionState()
  const { t } = useI18n()
  const { pop } = useNav()
  const actions = usePresenceActions()
  const { stored, view } = usePresenceDetails(slug)
  const engagement = usePresenceEngagement(slug, { likes: view?.likes, activeUsers: view?.activeUsers, totalInstalls: view?.totalInstalls })
  const [reportOpen, setReportOpen] = useState(false)
  const [uninstallOpen, setUninstallOpen] = useState(false)

  if (!view) {
    return (
      <div className="flex min-h-full flex-col">
        <BackHeader onBack={pop} backLabel={t("action.back")} />
        <ScreenBody>
          {state.catalog.status === "error" ? (
            <Card>
              <EmptyState
                title={t("error.notFound")}
                description={t("library.errorDescription")}
                action={
                  <Button variant="secondary" onClick={() => void refresh.catalog(true)}>
                    {t("action.retry")}
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              <Skeleton className="aspect-[16/9] rounded-lg" />
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-32" />
            </>
          )}
        </ScreenBody>
      </div>
    )
  }

  const live = state.activity?.slug === slug ? state.activity : null

  const uninstall = () =>
    void actions.uninstall(slug, view.name).then(() => {
      setUninstallOpen(false)
      pop()
    })

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader
        onBack={pop}
        backLabel={t("action.back")}
        action={<PresenceLikeButton liked={engagement.liked} likes={engagement.likes} onToggle={() => void engagement.toggleLike()} />}
      />

      <ScreenBody className="gap-6 pt-0">
        <PresenceHero view={view} version={stored?.release?.version ?? view.version} />
        <PresencePrimaryActions view={view} stored={stored} />
        <PresenceStats activeUsers={engagement.activeUsers} totalInstalls={engagement.totalInstalls} likes={engagement.likes} />

        {live && (
          <Section title={t("activity.now")}>
            <LiveCard slug={slug} presence={live.presence} presenceName={view.name} t={t} compact status={state.settings.presencePaused ? "paused" : "live"} />
          </Section>
        )}

        <PresenceAboutSection view={view} />

        {stored && (
          <>
            <PresenceSettingsSection view={view} />
            <PresenceSnoozeSection slug={slug} name={view.name} stored={stored} />
            <PresenceScheduleSection slug={slug} stored={stored} />
          </>
        )}

        <PresenceInfoSection view={view} stored={stored} />

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" icon={<RiExternalLinkLine className="size-4" />} onClick={() => openUrl(siteUrl(`/library/${slug}`))}>
              {t("detail.viewOnWeb")}
            </Button>
            <Button variant="secondary" className="flex-1" icon={<RiFlagLine className="size-4" />} onClick={() => setReportOpen(true)}>
              {t("detail.report")}
            </Button>
          </div>
          {stored && (
            <Button variant="danger" icon={<RiDeleteBinLine className="size-4" />} onClick={() => setUninstallOpen(true)}>
              {t("detail.uninstall")}
            </Button>
          )}
        </div>
      </ScreenBody>

      <PresenceReportSheet slug={slug} name={view.name} open={reportOpen} onClose={() => setReportOpen(false)} />
      <PresenceUninstallSheet
        name={view.name}
        open={uninstallOpen}
        pending={actions.pending === slug}
        onClose={() => setUninstallOpen(false)}
        onConfirm={uninstall}
      />
    </div>
  )
}
