import { RiExternalLinkLine, RiRefreshLine } from "@remixicon/react"
import { isConnectionHealthy } from "@/components/layout/connection-status-bar"
import type { HostVersionInfo } from "@/hooks/use-host-version"
import { HOST_DOWNLOAD_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import type { NativeStatus } from "@/shared/types"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { cn } from "@/ui/utils"

type Props = {
  nativeStatus: NativeStatus
  hostVersionInfo: HostVersionInfo | null
  isCheckingHostVersion: boolean
  onCheckHostUpdate: () => void
  onConnect: () => void
}

export const NativeConnectionSection = ({ nativeStatus, hostVersionInfo, isCheckingHostVersion, onCheckHostUpdate, onConnect }: Props): React.JSX.Element => {
  const healthy = isConnectionHealthy(nativeStatus)

  return (
    <AccordionItem value="native">
      <AccordionTrigger className="px-4">{t("settings-group-native")}</AccordionTrigger>
      <AccordionContent className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className={cn("size-2 rounded-full", healthy ? "bg-accent" : nativeStatus.connected ? "bg-warning" : "bg-destructive")} />
            {healthy ? t("status-bar-discord-connected") : nativeStatus.connected ? t("status-bar-discord-closed") : t("status-bar-host-missing")}
          </div>
          <Button variant="outline" size="sm" onClick={onConnect}>
            <RiRefreshLine />
            {t("host-check-update")}
          </Button>
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
        ) : (
          <Badge variant="outline" className="w-fit">
            v{nativeStatus.version ?? "?"}
          </Badge>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
