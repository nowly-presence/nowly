import { buildDiagnosticSnapshot, isHostChecking, YOUTUBE_TEST_URL } from "@/features/diagnostics/diagnostic-status";
import { DiscordIcon } from "@/lib/icons";
import { extensionDetailsUrl, openUrl, siteUrl } from "@/shared/browser-links";
import { t } from "@/shared/i18n";
import { IconInfoCircle, IconChartBar, IconExternalLink, IconLock, IconDeviceDesktopDown, IconPuzzle2, IconShoppingBag, IconBrandYoutube } from "@tabler/icons-react";
import { ActionButton } from "@/features/onboarding/action-button";
import { AnalyticsChecklist } from "@/features/onboarding/analytics-checklist";
import { LinkActionButton } from "@/features/onboarding/link-action-button";
import type { GuidedStep, OnboardingOverlayProps, StepStatus } from "@/features/onboarding/onboarding.types";
import { requestUserScriptsPermission } from "@/features/onboarding/onboarding.utils";
import { QuietActionButton } from "@/features/onboarding/quiet-action-button";

type UseOnboardingStepsProps = Pick<
  OnboardingOverlayProps,
  | "activity"
  | "nativeStatus"
  | "userScripts"
  | "onConnectNative"
  | "presences"
  | "settings"
  | "onSettingsChange"
>;

export const useOnboardingSteps = ({
  activity,
  nativeStatus,
  userScripts,
  onConnectNative,
  presences,
  settings,
  onSettingsChange,
}: UseOnboardingStepsProps): GuidedStep[] => {
  const snapshot = buildDiagnosticSnapshot({ activity, nativeStatus, presences, userScripts });
  const hostStatus: StepStatus = snapshot.hostDetected ? "success" : isHostChecking(nativeStatus) ? "loading" : "error";
  const discordStatus: StepStatus = snapshot.discordConnected ? "success" : snapshot.hostDetected ? "error" : "loading";
  const youtubeInstallStatus: StepStatus = snapshot.youtubePresenceInstalled ? "success" : snapshot.discordConnected ? "error" : "loading";
  const youtubeTestStatus: StepStatus = snapshot.youtubeActivityDetected ? "success" : snapshot.youtubePresenceInstalled ? "error" : "loading";
  const analyticsConsentDecided = settings.analyticsConsent !== undefined;
  const showHostActions = snapshot.userScriptsActive && !snapshot.hostDetected && hostStatus !== "loading";

  return [
    { icon: IconPuzzle2, status: "success", title: t("onboarding-step-extension-title"), message: t("onboarding-step-extension-success") },
    {
      icon: IconLock,
      status: snapshot.userScriptsActive ? "success" : "error",
      title: t("onboarding-step-user-scripts-title"),
      message: snapshot.userScriptsActive
        ? t("onboarding-step-user-scripts-success")
        : t("onboarding-step-user-scripts-error"),
      details: !snapshot.userScriptsActive ? (
        <div className="mt-4 space-y-2 rounded-lg border border-border bg-card-2 p-3 text-left">
          <p className="text-xs leading-5 text-muted-foreground">{t("onboarding-user-scripts-gate-body")}</p>
          <p className="text-xs leading-5 text-dim-foreground">{t("onboarding-user-scripts-gate-privacy")}</p>
        </div>
      ) : undefined,
      actions: !snapshot.userScriptsActive ? (
        import.meta.env.BROWSER === "firefox" ? (
          <ActionButton primary onClick={requestUserScriptsPermission}>
            {t("onboarding-user-scripts-allow")}
          </ActionButton>
        ) : (
          <ActionButton primary onClick={() => openUrl(extensionDetailsUrl({ useFirefoxAddonsPage: true }))}>
            {t("onboarding-user-scripts-open-page")}
            <IconExternalLink className="h-4 w-4" />
          </ActionButton>
        )
      ) : undefined,
    },
    {
      icon: IconDeviceDesktopDown,
      status: snapshot.userScriptsActive ? hostStatus : "loading",
      title: t("onboarding-step-host-title"),
      message: snapshot.hostDetected
        ? t("onboarding-step-host-success")
        : hostStatus === "loading" && snapshot.userScriptsActive
          ? t("onboarding-step-host-loading")
          : t("onboarding-step-host-error"),
      actions: showHostActions ? (
        <div className="flex flex-wrap justify-center gap-2">
          <ActionButton primary onClick={() => openUrl(siteUrl("/host"))}>
            {t("diagnostic-install-host")}
            <IconExternalLink className="h-4 w-4" />
          </ActionButton>
          <ActionButton onClick={onConnectNative}>{t("diagnostic-check-connection")}</ActionButton>
        </div>
      ) : undefined,
    },
    {
      icon: DiscordIcon,
      status: discordStatus,
      title: t("onboarding-step-discord-title"),
      message: snapshot.discordConnected
        ? t("diagnostic-discord-connected-message")
        : snapshot.hostDetected
          ? t("diagnostic-discord-closed-message")
          : t("onboarding-step-discord-waiting"),
      actions: snapshot.hostDetected && !snapshot.discordConnected ? (
        <ActionButton primary onClick={onConnectNative}>{t("diagnostic-check-connection")}</ActionButton>
      ) : undefined,
    },
    {
      icon: IconShoppingBag,
      status: youtubeInstallStatus,
      title: t("onboarding-step-presence-title"),
      message: snapshot.youtubePresenceInstalled
        ? t("onboarding-step-presence-success")
        : snapshot.discordConnected
          ? t("onboarding-step-presence-error")
          : t("onboarding-step-presence-waiting"),
      actions: snapshot.discordConnected && !snapshot.youtubePresenceInstalled ? (
        <ActionButton primary onClick={() => openUrl(siteUrl("/library/youtube"))}>
          {t("diagnostic-install-youtube")}
          <IconExternalLink className="h-4 w-4" />
        </ActionButton>
      ) : undefined,
    },
    {
      icon: IconBrandYoutube,
      status: youtubeTestStatus,
      title: t("onboarding-step-youtube-title"),
      message: snapshot.youtubeActivityDetected
        ? t("onboarding-step-youtube-success")
        : snapshot.youtubePresenceInstalled
          ? t("onboarding-step-youtube-error")
          : t("onboarding-step-youtube-waiting"),
      actions: snapshot.youtubePresenceInstalled && !snapshot.youtubeActivityDetected ? (
        <ActionButton primary onClick={() => openUrl(YOUTUBE_TEST_URL)}>
          {t("diagnostic-test-youtube")}
          <IconExternalLink className="h-4 w-4" />
        </ActionButton>
      ) : undefined,
    },
    {
      icon: IconChartBar,
      status: snapshot.youtubeActivityDetected
        ? analyticsConsentDecided
          ? "success"
          : "error"
        : "loading",
      title: t("onboarding-analytics-title"),
      message: analyticsConsentDecided
        ? t("onboarding-step-analytics-success")
        : snapshot.youtubeActivityDetected
          ? t("onboarding-analytics-help")
          : t("onboarding-step-analytics-waiting"),
      details: snapshot.youtubeActivityDetected && !analyticsConsentDecided ? <AnalyticsChecklist /> : undefined,
      actions: snapshot.youtubeActivityDetected && !analyticsConsentDecided ? (
        <div className="flex flex-col items-center gap-2">
          <ActionButton primary onClick={() => onSettingsChange({ analyticsConsent: true })}>
            {t("onboarding-analytics-accept")}
          </ActionButton>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <QuietActionButton onClick={() => onSettingsChange({ analyticsConsent: false })}>
              {t("onboarding-analytics-decline")}
            </QuietActionButton>
            <LinkActionButton onClick={() => openUrl(siteUrl("/data-collected"))}>
              <IconInfoCircle className="h-3.5 w-3.5" />
              {t("onboarding-analytics-learn-more")}
            </LinkActionButton>
          </div>
        </div>
      ) : undefined,
    },
  ];
};