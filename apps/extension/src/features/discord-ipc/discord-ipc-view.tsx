import { useState } from "react"
import { RiArrowLeftLine, RiExternalLinkLine, RiRefreshLine } from "@remixicon/react"
import { BackHeader, ScreenBody } from "@/components/shared/screen"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { sendMessage } from "@/lib/messages"
import { docsUrl, openUrl } from "@/shared/browser-links"
import { TROUBLESHOOTING_DOCS_PATH } from "@/shared/constants"
import { discordIpcIssueOf } from "@/shared/discord-ipc-prompt"
import { Button } from "@/ui/button"
import { DiscordIpcHero } from "@/features/discord-ipc/discord-ipc-hero"
import { DiscordIpcSteps } from "@/features/discord-ipc/discord-ipc-steps"

const RECONNECT_SETTLE_MS = 900

export const DiscordIpcView = () => {
  const { state, patch } = useExtensionState()
  const { t, locale } = useI18n()
  const { pop } = useNav()
  const [busy, setBusy] = useState(false)
  const [stillBlocked, setStillBlocked] = useState(false)
  const resolved = Boolean(state.native.discordConnected) && !discordIpcIssueOf(state.native).active

  const reconnect = async () => {
    setBusy(true)
    setStillBlocked(false)
    await sendMessage("CONNECT_NATIVE").catch(() => {})
    await new Promise((resolve) => setTimeout(resolve, RECONNECT_SETTLE_MS))
    const native = await sendMessage("GET_NATIVE_STATUS").catch(() => null)
    if (native) patch({ native })
    setStillBlocked(!native?.discordConnected)
    setBusy(false)
  }

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader onBack={pop} backLabel={t("action.back")} />
      <ScreenBody className="pt-1">
        <DiscordIpcHero
          resolved={resolved}
          title={resolved ? t("discordIpc.resolvedTitle") : t("discordIpc.title")}
          description={resolved ? t("discordIpc.resolvedDescription") : t("discordIpc.description")}
        />
        {resolved ? (
          <Button icon={<RiArrowLeftLine className="size-4" />} onClick={pop}>
            {t("action.back")}
          </Button>
        ) : (
          <>
            <DiscordIpcSteps />
            <div className="flex flex-col gap-2">
              <Button loading={busy} icon={<RiRefreshLine className="size-4" />} onClick={() => void reconnect()}>
                {t("connection.reconnect")}
              </Button>
              {stillBlocked && !busy && (
                <p role="status" className="px-1 text-center text-body-sm text-danger">
                  {t("discordIpc.stillBlocked")}
                </p>
              )}
              <Button
                variant="secondary"
                icon={<RiExternalLinkLine className="size-4" />}
                onClick={() => openUrl(docsUrl(TROUBLESHOOTING_DOCS_PATH, locale))}
              >
                {t("discordIpc.learnMore")}
              </Button>
            </div>
          </>
        )}
      </ScreenBody>
    </div>
  )
}
