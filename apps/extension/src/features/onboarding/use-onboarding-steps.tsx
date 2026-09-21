import { RiDiscordFill, RiExternalLinkLine, RiLockLine, RiComputerLine, RiShoppingBag3Line, RiYoutubeFill } from "@remixicon/react"
import { useEffect, useState } from "react"
import { ChromeOsWaitlistForm } from "@/features/onboarding/chromeos-waitlist-form"
import type { GuidedStep, OnboardingOverlayProps, StepStatus } from "@/features/onboarding/onboarding.types"
import { requestUserScriptsPermission } from "@/features/onboarding/onboarding.utils"
import { buildDiagnosticSnapshot, isHostChecking, YOUTUBE_TEST_URL } from "@/features/diagnostics/diagnostic-status"
import { extensionDetailsUrl, openUrl, siteUrl } from "@/shared/browser-links"
import { t } from "@/shared/i18n"
import { Button } from "@/ui/button"

const useIsChromeOs = (): boolean => {
  const [isChromeOs, setIsChromeOs] = useState(false)
  useEffect(() => {
    chrome.runtime
      .getPlatformInfo()
      .then((info) => setIsChromeOs(info.os === "cros"))
      .catch(() => {})
  }, [])
  return isChromeOs
}

type UseOnboardingStepsProps = Pick<
  OnboardingOverlayProps,
  "activity" | "nativeStatus" | "userScripts" | "onConnectNative" | "presences" | "hostVersionInfo"
>

export const useOnboardingSteps = ({
  activity,
  nativeStatus,
  userScripts,
  onConnectNative,
  presences,
  hostVersionInfo,
}: UseOnboardingStepsProps): GuidedStep[] => {
  const isChromeOs = useIsChromeOs()
  const snapshot = buildDiagnosticSnapshot({ activity, nativeStatus, presences, userScripts })
  const hostStatus: StepStatus = snapshot.hostDetected ? "success" : isHostChecking(nativeStatus) ? "loading" : "error"
  const discordStatus: StepStatus = snapshot.discordConnected ? "success" : snapshot.hostDetected ? "error" : "loading"
  const youtubeInstallStatus: StepStatus = snapshot.youtubePresenceInstalled ? "success" : snapshot.discordConnected ? "error" : "loading"
  const youtubeTestStatus: StepStatus = snapshot.youtubeActivityDetected
    ? "success"
    : snapshot.youtubePresenceInstalled
      ? "error"
      : "loading"
  const showHostActions = snapshot.userScriptsActive && !snapshot.hostDetected && hostStatus !== "loading"

  return [
    {
      icon: RiShoppingBag3Line,
      status: "success",
      title: t("onboarding-step-extension-title"),
      message: t("onboarding-step-extension-success"),
    },
    {
      icon: RiLockLine,
      status: snapshot.userScriptsActive ? "success" : "error",
      title: t("onboarding-step-user-scripts-title"),
      message: snapshot.userScriptsActive ? t("onboarding-step-user-scripts-success") : t("onboarding-step-user-scripts-error"),
      details: !snapshot.userScriptsActive ? (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-secondary p-3 text-left">
          <p className="text-sm leading-5 text-muted-foreground">{t("onboarding-user-scripts-gate-body")}</p>
          <p className="text-sm leading-5 text-muted-foreground">{t("onboarding-user-scripts-gate-privacy")}</p>
        </div>
      ) : undefined,
      actions: !snapshot.userScriptsActive ? (
        import.meta.env.BROWSER === "firefox" ? (
          <Button onClick={requestUserScriptsPermission}>{t("onboarding-user-scripts-allow")}</Button>
        ) : (
          <Button onClick={() => openUrl(extensionDetailsUrl({ useFirefoxAddonsPage: true }))}>
            {t("onboarding-user-scripts-open-page")}
            <RiExternalLinkLine className="size-4" />
          </Button>
        )
      ) : undefined,
    },
    isChromeOs
      ? {
          icon: RiComputerLine,
          status: "error" as StepStatus,
          title: t("onboarding-step-host-chromeos-title"),
          message: t("onboarding-step-host-chromeos-message"),
          details: <ChromeOsWaitlistForm />,
        }
      : {
          icon: RiComputerLine,
          status: snapshot.userScriptsActive ? hostStatus : "loading",
          title: t("onboarding-step-host-title"),
          message: snapshot.hostDetected
            ? hostVersionInfo?.updateAvailable
              ? t("onboarding-step-host-outdated", {
                  current: hostVersionInfo.currentVersion ?? "?",
                  latest: hostVersionInfo.latestVersion,
                })
              : t("onboarding-step-host-success")
            : hostStatus === "loading" && snapshot.userScriptsActive
              ? t("onboarding-step-host-loading")
              : t("onboarding-step-host-error"),
          actions:
            showHostActions || (snapshot.hostDetected && hostVersionInfo?.updateAvailable) ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => openUrl(siteUrl("/desktop"))}>
                  {hostVersionInfo?.updateAvailable ? t("diagnostic-update-host") : t("diagnostic-install-host")}
                  <RiExternalLinkLine className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onConnectNative}
                >
                  {t("diagnostic-check-connection")}
                </Button>
              </div>
            ) : undefined,
        },
    {
      icon: RiDiscordFill,
      status: discordStatus,
      title: t("onboarding-step-discord-title"),
      message: snapshot.discordConnected
        ? t("diagnostic-discord-connected-message")
        : snapshot.hostDetected
          ? t("diagnostic-discord-closed-message")
          : t("onboarding-step-discord-waiting"),
      actions:
        snapshot.hostDetected && !snapshot.discordConnected ? (
          <Button
            variant="outline"
            onClick={onConnectNative}
          >
            {t("diagnostic-check-connection")}
          </Button>
        ) : undefined,
    },
    {
      icon: RiShoppingBag3Line,
      status: youtubeInstallStatus,
      title: t("onboarding-step-presence-title"),
      message: snapshot.youtubePresenceInstalled
        ? t("onboarding-step-presence-success")
        : snapshot.discordConnected
          ? t("onboarding-step-presence-error")
          : t("onboarding-step-presence-waiting"),
      actions:
        snapshot.discordConnected && !snapshot.youtubePresenceInstalled ? (
          <Button onClick={() => openUrl(siteUrl("/library/youtube"))}>
            {t("diagnostic-install-youtube")}
            <RiExternalLinkLine className="size-4" />
          </Button>
        ) : undefined,
    },
    {
      icon: RiYoutubeFill,
      status: youtubeTestStatus,
      title: t("onboarding-step-youtube-title"),
      message: snapshot.youtubeActivityDetected
        ? t("onboarding-step-youtube-success")
        : snapshot.youtubePresenceInstalled
          ? t("onboarding-step-youtube-error")
          : t("onboarding-step-youtube-waiting"),
      actions:
        snapshot.youtubePresenceInstalled && !snapshot.youtubeActivityDetected ? (
          <Button onClick={() => openUrl(YOUTUBE_TEST_URL)}>
            {t("diagnostic-test-youtube")}
            <RiExternalLinkLine className="size-4" />
          </Button>
        ) : undefined,
    },
  ]
}
