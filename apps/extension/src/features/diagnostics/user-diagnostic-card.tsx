import { RiClipboardLine, RiExternalLinkLine } from "@remixicon/react"
import { useMemo } from "react"
import { buildDiagnosticSnapshot, isHostChecking, YOUTUBE_TEST_URL } from "@/features/diagnostics/diagnostic-status"
import { StatusRow, type RowStatus } from "@/features/diagnostics/status-row"
import { useSupportDiagnostic } from "@/features/diagnostics/use-support-diagnostic"
import { extensionDetailsUrl, openUrl, siteUrl } from "@/shared/browser-links"
import { t } from "@/shared/i18n"
import type { CurrentActivity, InstalledPresences, NativeStatus, UserScriptsStatus } from "@/shared/types"
import { Button } from "@/ui/button"

type Props = {
  activity: CurrentActivity | null
  nativeStatus: NativeStatus
  onConnectNative: () => void
  presences: InstalledPresences
  userScripts: UserScriptsStatus
}

const SmallAction = ({ onClick, children }: { onClick?: () => void; children: React.ReactNode }): React.JSX.Element => (
  <Button variant="outline" size="xs" onClick={onClick}>
    {children}
  </Button>
)

export const UserDiagnosticCard = ({ activity, nativeStatus, onConnectNative, presences, userScripts }: Props): React.JSX.Element => {
  const snapshot = useMemo(() => buildDiagnosticSnapshot({ activity, nativeStatus, presences, userScripts }), [activity, nativeStatus, presences, userScripts])
  const { copied, copySupportDiagnostic } = useSupportDiagnostic(snapshot)

  const hostStatus: RowStatus = snapshot.hostDetected ? "success" : isHostChecking(nativeStatus) ? "loading" : "error"
  const discordStatus: RowStatus = snapshot.discordConnected ? "success" : hostStatus === "loading" ? "loading" : "error"
  const youtubeInstalled = snapshot.youtubePresenceInstalled

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("diagnostic-title")}</h2>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{t("diagnostic-description")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copySupportDiagnostic}>
          <RiClipboardLine className="size-3.5" />
          {copied ? t("support-diagnostic-copied") : t("support-diagnostic-copy")}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <StatusRow status="success" label={t("diagnostic-extension-installed")} message={t("diagnostic-extension-installed-message")} />

        <StatusRow
          status={snapshot.userScriptsActive ? "success" : "error"}
          label={t("diagnostic-user-scripts-active")}
          message={snapshot.userScriptsActive ? t("diagnostic-user-scripts-active-message") : t("diagnostic-user-scripts-missing-message")}
          action={
            !snapshot.userScriptsActive ? (
              <SmallAction onClick={() => openUrl(extensionDetailsUrl())}>
                {t("onboarding-user-scripts-open-page")}
                <RiExternalLinkLine className="size-3" />
              </SmallAction>
            ) : undefined
          }
        />

        <StatusRow
          status={hostStatus}
          label={t("diagnostic-host-detected")}
          message={snapshot.hostDetected ? t("diagnostic-host-detected-message") : hostStatus === "loading" ? t("diagnostic-host-checking-message") : t("diagnostic-host-missing-message")}
          action={
            !snapshot.hostDetected && hostStatus !== "loading" ? (
              <>
                <SmallAction onClick={() => openUrl(siteUrl("/desktop"))}>
                  {t("diagnostic-install-host")}
                  <RiExternalLinkLine className="size-3" />
                </SmallAction>
                <SmallAction onClick={onConnectNative}>{t("diagnostic-check-connection")}</SmallAction>
              </>
            ) : undefined
          }
        />

        <StatusRow
          status={discordStatus}
          label={t("diagnostic-discord-connected")}
          message={snapshot.discordConnected ? t("diagnostic-discord-connected-message") : snapshot.hostDetected ? t("diagnostic-discord-closed-message") : t("diagnostic-discord-waiting-host-message")}
          action={!snapshot.discordConnected && snapshot.hostDetected ? <SmallAction onClick={onConnectNative}>{t("diagnostic-check-connection")}</SmallAction> : undefined}
        />

        <StatusRow
          status={snapshot.presenceInstalled ? "success" : "error"}
          label={t("diagnostic-presence-installed")}
          message={snapshot.presenceInstalled ? t("diagnostic-presence-installed-message", { count: String(snapshot.installedPresenceCount) }) : t("diagnostic-presence-missing-message")}
          action={
            !snapshot.presenceInstalled ? (
              <SmallAction onClick={() => openUrl(siteUrl("/library/youtube"))}>
                {t("diagnostic-install-youtube")}
                <RiExternalLinkLine className="size-3" />
              </SmallAction>
            ) : undefined
          }
        />

        <StatusRow
          status={snapshot.activityDetected ? "success" : "error"}
          label={t("diagnostic-activity-detected")}
          message={snapshot.activityDetected ? t("diagnostic-activity-detected-message", { presence: snapshot.currentPresenceName ?? "Nowly" }) : youtubeInstalled ? t("diagnostic-activity-missing-youtube-message") : t("diagnostic-activity-missing-message")}
          action={
            !snapshot.activityDetected ? (
              <SmallAction onClick={() => openUrl(youtubeInstalled ? YOUTUBE_TEST_URL : siteUrl("/library/youtube"))}>
                {youtubeInstalled ? t("diagnostic-test-youtube") : t("diagnostic-install-youtube")}
                <RiExternalLinkLine className="size-3" />
              </SmallAction>
            ) : undefined
          }
        />
      </div>
    </section>
  )
}
