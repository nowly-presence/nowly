import { t } from "@/shared/i18n";
import { useCallback, useMemo, useState } from "react";
import type { buildDiagnosticSnapshot } from "@/features/diagnostics/diagnostic-status";

type DiagnosticSnapshot = ReturnType<typeof buildDiagnosticSnapshot>;

export const useSupportDiagnostic = (
  snapshot: DiagnosticSnapshot,
): { copied: boolean; copySupportDiagnostic: () => void } => {
  const [copied, setCopied] = useState(false);
  const supportLines = useMemo(() => [
    `${t("diagnostic-extension-installed")}: ${snapshot.extensionInstalled ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-user-scripts-active")}: ${snapshot.userScriptsActive ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-host-detected")}: ${snapshot.hostDetected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-discord-connected")}: ${snapshot.discordConnected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-presence-installed")}: ${snapshot.presenceInstalled ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
    `${t("diagnostic-activity-detected")}: ${snapshot.activityDetected ? t("diagnostic-status-ok") : t("diagnostic-status-missing")}`,
  ], [snapshot]);

  const copySupportDiagnostic = useCallback((): void => {
    void navigator.clipboard.writeText(supportLines.join("\n")).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }, [supportLines]);

  return { copied, copySupportDiagnostic };
};