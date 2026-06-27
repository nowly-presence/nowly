import { Button } from "@/components/ui/button";
import type { NativeStatus } from "@/lib/messages";
import { extensionDetailsUrl, openUrl, siteUrl } from "@/shared/browser-links";
import { t } from "@/shared/i18n";
import type { CurrentActivity, InstalledPresences, UserScriptsStatus } from "@/shared/types";
import { IconClipboard, IconExternalLink } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useMemo } from "react";
import { buildDiagnosticSnapshot, isHostChecking, YOUTUBE_TEST_URL } from "@/features/diagnostics/diagnostic-status";
import { SmallAction } from "@/features/diagnostics/small-action";
import type { RowStatus } from "@/features/diagnostics/status-icon";
import { StatusRow } from "@/features/diagnostics/status-row";
import { useSupportDiagnostic } from "@/features/diagnostics/use-support-diagnostic";

type Props = {
  activity: CurrentActivity | null;
  nativeStatus: NativeStatus;
  onConnectNative: () => void;
  presences: InstalledPresences;
  userScripts: UserScriptsStatus;
};

export const UserDiagnosticCard: FC<Props> = ({
  activity,
  nativeStatus,
  onConnectNative,
  presences,
  userScripts,
}): ReactElement => {
  const snapshot = useMemo(() => buildDiagnosticSnapshot({
    activity,
    nativeStatus,
    presences,
    userScripts,
  }), [activity, nativeStatus, presences, userScripts]);
  const { copied, copySupportDiagnostic } = useSupportDiagnostic(snapshot);

  const hostStatus: RowStatus = snapshot.hostDetected
    ? "success"
    : isHostChecking(nativeStatus)
      ? "loading"
      : "error";

  const discordStatus: RowStatus = snapshot.discordConnected
    ? "success"
    : hostStatus === "loading"
      ? "loading"
      : "error";

  const youtubeInstalled = snapshot.youtubePresenceInstalled;

  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("diagnostic-title")}
          </h2>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
            {t("diagnostic-description")}
          </p>
        </div>

        <Button
          variant="unstyled"
          size="none"
          onClick={copySupportDiagnostic}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
        >
          <IconClipboard className="h-3.5 w-3.5" />
          {copied ? t("support-diagnostic-copied") : t("support-diagnostic-copy")}
        </Button>
      </div>

      <div className="grid gap-2">
        <StatusRow
          status="success"
          label={t("diagnostic-extension-installed")}
          message={t("diagnostic-extension-installed-message")}
        />

        <StatusRow
          status={snapshot.userScriptsActive ? "success" : "error"}
          label={t("diagnostic-user-scripts-active")}
          message={snapshot.userScriptsActive
            ? t("diagnostic-user-scripts-active-message")
            : t("diagnostic-user-scripts-missing-message")}
          action={!snapshot.userScriptsActive ? (
            <SmallAction onClick={() => openUrl(extensionDetailsUrl())}>
              {t("onboarding-user-scripts-open-page")}
              <IconExternalLink className="h-3 w-3" />
            </SmallAction>
          ) : undefined}
        />

        <StatusRow
          status={hostStatus}
          label={t("diagnostic-host-detected")}
          message={snapshot.hostDetected
            ? t("diagnostic-host-detected-message")
            : hostStatus === "loading"
              ? t("diagnostic-host-checking-message")
              : t("diagnostic-host-missing-message")}
          action={!snapshot.hostDetected && hostStatus !== "loading" ? (
            <>
              <SmallAction onClick={() => openUrl(siteUrl("/host"))}>
                {t("diagnostic-install-host")}
                <IconExternalLink className="h-3 w-3" />
              </SmallAction>
              <SmallAction onClick={onConnectNative}>{t("diagnostic-check-connection")}</SmallAction>
            </>
          ) : undefined}
        />

        <StatusRow
          status={discordStatus}
          label={t("diagnostic-discord-connected")}
          message={snapshot.discordConnected
            ? t("diagnostic-discord-connected-message")
            : snapshot.hostDetected
              ? t("diagnostic-discord-closed-message")
              : t("diagnostic-discord-waiting-host-message")}
          action={!snapshot.discordConnected && snapshot.hostDetected ? (
            <SmallAction onClick={onConnectNative}>{t("diagnostic-check-connection")}</SmallAction>
          ) : undefined}
        />

        <StatusRow
          status={snapshot.presenceInstalled ? "success" : "error"}
          label={t("diagnostic-presence-installed")}
          message={snapshot.presenceInstalled
            ? t("diagnostic-presence-installed-message", { count: String(snapshot.installedPresenceCount) })
            : t("diagnostic-presence-missing-message")}
          action={!snapshot.presenceInstalled ? (
            <SmallAction onClick={() => openUrl(siteUrl("/library/youtube"))}>
              {t("diagnostic-install-youtube")}
              <IconExternalLink className="h-3 w-3" />
            </SmallAction>
          ) : undefined}
        />

        <StatusRow
          status={snapshot.activityDetected ? "success" : "error"}
          label={t("diagnostic-activity-detected")}
          message={snapshot.activityDetected
            ? t("diagnostic-activity-detected-message", { presence: snapshot.currentPresenceName ?? "Nowly" })
            : youtubeInstalled
              ? t("diagnostic-activity-missing-youtube-message")
              : t("diagnostic-activity-missing-message")}
          action={!snapshot.activityDetected ? (
            <SmallAction onClick={() => openUrl(youtubeInstalled ? YOUTUBE_TEST_URL : siteUrl("/library/youtube"))}>
              {youtubeInstalled ? t("diagnostic-test-youtube") : t("diagnostic-install-youtube")}
              <IconExternalLink className="h-3 w-3" />
            </SmallAction>
          ) : undefined}
        />
      </div>
    </section>
  );
};