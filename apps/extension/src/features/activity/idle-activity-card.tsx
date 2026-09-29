import { RiDiscordLine, RiPlayCircleLine, RiPlugLine, RiPulseLine, RiRefreshLine } from "@remixicon/react"
import { HOST_DOWNLOAD_URL } from "@/shared/constants"
import { openUrl } from "@/shared/browser-links"
import { Button } from "@/ui/button"
import { Card } from "@/ui/card"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { useNav } from "@/hooks/navigation-provider"
import { connectionOf } from "@/lib/presence-status"
import { useExtensionState } from "@/hooks/extension-state-provider"

export const IdleCard = ({
  connection,
  paused,
  onResume,
  hasPresences,
}: {
  connection: ReturnType<typeof connectionOf>
  paused: boolean
  onResume: () => void
  hasPresences: boolean
}) => {
  const { t } = useI18n()
  const { push } = useNav()
  const { refresh } = useExtensionState()

  if (paused) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-hover text-muted">
          <RiPlayCircleLine className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-label-lg font-medium">{t("activity.pausedTitle")}</span>
          <span className="text-label-md text-muted">{t("activity.pausedDescription")}</span>
        </div>
        <Button size="sm" onClick={onResume}>
          {t("action.resume")}
        </Button>
      </Card>
    )
  }

  if (connection === "no-host") {
    return (
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-danger-soft text-danger">
            <RiPlugLine className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label-lg font-medium">{t("activity.noHostTitle")}</span>
            <span className="text-body-sm text-muted">{t("activity.noHostDescription")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => openUrl(HOST_DOWNLOAD_URL)}>
            {t("action.downloadApp")}
          </Button>
          <Button
            variant="secondary"
            icon={<RiRefreshLine className="size-4" />}
            onClick={() => void sendMessage("CONNECT_NATIVE").then(() => refresh.native())}
          >
            {t("action.retry")}
          </Button>
        </div>
      </Card>
    )
  }

  if (connection === "no-discord") {
    return (
      <Card className="flex items-start gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-hover text-muted">
          <RiDiscordLine className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-label-lg font-medium">{t("activity.noDiscordTitle")}</span>
          <span className="text-body-sm text-muted">{t("activity.noDiscordDescription")}</span>
          <Button variant="link" className="mt-1 self-start" onClick={() => push({ name: "connection" })}>
            {t("activity.checkConnection")}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-dashed border-line-strong p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-hover text-muted" aria-hidden>
          <RiPulseLine className="size-7" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-label-lg font-medium">{t("activity.idleTitle")}</span>
          <span className="text-body-sm text-muted">{hasPresences ? t("activity.idleDescription") : t("activity.idleDescriptionEmpty")}</span>
        </div>
      </div>
    </div>
  )
}
