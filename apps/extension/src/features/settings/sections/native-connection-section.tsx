import { RiClipboardLine, RiExternalLinkLine, RiRefreshLine, RiStethoscopeLine } from "@remixicon/react"
import { useMemo } from "react"
import { isConnectionHealthy } from "@/components/layout/connection-status-bar"
import { buildDiagnosticSnapshot } from "@/features/diagnostics/diagnostic-status"
import { UserDiagnosticCard } from "@/features/diagnostics/user-diagnostic-card"
import { useSupportDiagnostic } from "@/features/diagnostics/use-support-diagnostic"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import type { HostVersionInfo } from "@/hooks/use-host-version"
import { HOST_DOWNLOAD_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import type { CurrentActivity, InstalledPresences, NativeStatus, UserScriptsStatus } from "@/shared/types"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog"
import { cn } from "@/ui/utils"

type Props = {
  activity: CurrentActivity | null
  presences: InstalledPresences
  userScripts: UserScriptsStatus
  nativeStatus: NativeStatus
  hostVersionInfo: HostVersionInfo | null
  isCheckingHostVersion: boolean
  onCheckHostUpdate: () => void
  onConnect: () => void
  isConnecting: boolean
  onBack: () => void
}

export const NativeConnectionSection = ({ activity, presences, userScripts, nativeStatus, hostVersionInfo, isCheckingHostVersion, onCheckHostUpdate, onConnect, isConnecting, onBack }: Props): React.JSX.Element => {
  const healthy = isConnectionHealthy(nativeStatus)
  const snapshot = useMemo(() => buildDiagnosticSnapshot({ activity, nativeStatus, presences, userScripts }), [activity, nativeStatus, presences, userScripts])
  const { copied, copySupportDiagnostic } = useSupportDiagnostic(snapshot)

  return (
    <div className="flex flex-col gap-3">
      <SettingsSectionHeader title={t("settings-group-native")} onBack={onBack} />
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-foreground">
            <span className={cn("size-2 shrink-0 rounded-full", healthy ? "bg-accent" : nativeStatus.connected ? "bg-warning" : "bg-destructive")} />
            <span className="truncate">{healthy ? t("status-bar-discord-connected") : nativeStatus.connected ? t("status-bar-discord-closed") : t("status-bar-host-missing")}</span>
          </div>
          <Badge variant="outline" className="shrink-0">
            v{nativeStatus.version ?? "?"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onConnect} disabled={isConnecting}>
            <RiRefreshLine className={cn(isConnecting && "animate-spin")} />
            {t("host-check-update")}
          </Button>
          <Dialog>
            <DialogTrigger render={<Button variant="outline" size="sm" className="flex-1" />}>
              <RiStethoscopeLine className="size-3.5" />
              {t("diagnostic-title")}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("diagnostic-title")}</DialogTitle>
                <DialogDescription>{t("diagnostic-description")}</DialogDescription>
              </DialogHeader>
              <UserDiagnosticCard activity={activity} nativeStatus={nativeStatus} onConnectNative={onConnect} presences={presences} userScripts={userScripts} />
              <DialogFooter>
                <Button variant="outline" onClick={copySupportDiagnostic}>
                  <RiClipboardLine className="size-3.5" />
                  {copied ? t("support-diagnostic-copied") : t("support-diagnostic-copy")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {hostVersionInfo?.updateAvailable ? (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
          <p className="mb-2 text-xs font-semibold text-accent">{t("host-update-available", { latestVersion: hostVersionInfo.latestVersion })}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1 border-accent/20 bg-accent/10 text-accent hover:bg-accent/20" render={<a href={HOST_DOWNLOAD_URL} target="_blank" rel="noreferrer" />}>
              {t("host-download-update")}
              <RiExternalLinkLine className="size-3.5" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={onCheckHostUpdate} disabled={isCheckingHostVersion}>
              <RiRefreshLine className={cn("size-3.5", isCheckingHostVersion && "animate-spin")} />
              {t("host-check-update")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
