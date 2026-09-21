import { useCallback, useMemo, useState } from "react"
import type { buildDiagnosticSnapshot } from "@/features/diagnostics/diagnostic-status"
import { getLocale, t } from "@/shared/i18n"

type DiagnosticSnapshot = ReturnType<typeof buildDiagnosticSnapshot>

export const useSupportDiagnostic = (snapshot: DiagnosticSnapshot): { copied: boolean; copySupportDiagnostic: () => void } => {
  const [copied, setCopied] = useState(false)
  const supportLines = useMemo(
    () => [
      `Extension version: ${chrome.runtime.getManifest().version}`,
      `Locale: ${getLocale()}`,
      `${t("diagnostic-extension-installed")}: ${snapshot.extensionInstalled ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
      `${t("diagnostic-user-scripts-active")}: ${snapshot.userScriptsActive ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
      `${t("diagnostic-host-detected")}: ${snapshot.hostDetected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
      `${t("diagnostic-discord-connected")}: ${snapshot.discordConnected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
      `${t("diagnostic-presence-installed")}: ${snapshot.presenceInstalled ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
      `${t("diagnostic-activity-detected")}: ${snapshot.activityDetected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
      `Installed presences: ${snapshot.installedPresenceCount}`,
      `Current presence: ${snapshot.currentPresenceName ?? "None"}`,
    ],
    [snapshot],
  )

  const copySupportDiagnostic = useCallback((): void => {
    void navigator.clipboard.writeText([`Checked at: ${new Date().toISOString()}`, ...supportLines].join("\n")).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    })
  }, [supportLines])

  return { copied, copySupportDiagnostic }
}
