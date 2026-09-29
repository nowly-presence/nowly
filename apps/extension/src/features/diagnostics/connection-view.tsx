import { useCallback, useEffect, useState } from "react"
import {
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiComputerLine,
  RiDownloadLine,
  RiErrorWarningFill,
  RiFileList3Line,
  RiRefreshLine,
  RiRestartLine,
} from "@remixicon/react"
import type { DiagnosticSnapshot } from "@/background/router/contracts"
import { extensionDetailsUrl, openUrl } from "@/shared/browser-links"
import { HOST_DOWNLOAD_URL } from "@/shared/constants"
import { Button } from "@/ui/button"
import { LiveDot } from "@/ui/live-dot"
import { DiscordAvatar } from "@/components/shared/discord-avatar"
import { BackHeader, ScreenBody } from "@/components/shared/screen"
import { Card, Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { Section } from "@/ui/section"
import type { MessageKey } from "@/hooks/i18n-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { useNav } from "@/hooks/navigation-provider"
import { connectionOf } from "@/lib/presence-status"
import { useExtensionState } from "@/hooks/extension-state-provider"

const CHECKS: { key: keyof DiagnosticSnapshot; label: MessageKey; hint: MessageKey }[] = [
  { key: "extensionInstalled", label: "check.extension", hint: "check.extensionHint" },
  { key: "userScriptsActive", label: "check.userScripts", hint: "check.userScriptsHint" },
  { key: "hostDetected", label: "check.host", hint: "check.hostHint" },
  { key: "discordConnected", label: "check.discord", hint: "check.discordHint" },
  { key: "presenceInstalled", label: "check.presence", hint: "check.presenceHint" },
  { key: "activityDetected", label: "check.activity", hint: "check.activityHint" },
]

export const ConnectionView = () => {
  const { state, refresh } = useExtensionState()
  const { t } = useI18n()
  const { pop, push, setTab } = useNav()
  const [diagnostic, setDiagnostic] = useState<DiagnosticSnapshot | null>(null)
  const [busy, setBusy] = useState<"reconnect" | "restart" | null>(null)
  const connection = connectionOf(state.native)
  const profile = state.onboarding.nativeProfile

  const load = useCallback(() => {
    void sendMessage("GET_DIAGNOSTIC").then(setDiagnostic).catch(() => {})
  }, [])

  useEffect(() => {
    load()
    const id = window.setInterval(load, 3000)
    return () => window.clearInterval(id)
  }, [load])

  const reconnect = async (kind: "reconnect" | "restart") => {
    setBusy(kind)
    await sendMessage(kind === "restart" ? "RESTART_NATIVE" : "CONNECT_NATIVE").catch(() => {})
    await new Promise((resolve) => setTimeout(resolve, 900))
    await refresh.native()
    load()
    setBusy(null)
  }

  const fix = (key: keyof DiagnosticSnapshot) => {
    if (key === "userScriptsActive") return <Button size="sm" variant="secondary" onClick={() => openUrl(extensionDetailsUrl({ useFirefoxAddonsPage: true }))}>{t("action.open")}</Button>
    if (key === "hostDetected") return <Button size="sm" variant="secondary" onClick={() => openUrl(HOST_DOWNLOAD_URL)}>{t("action.download")}</Button>
    if (key === "presenceInstalled") return <Button size="sm" variant="secondary" onClick={() => setTab("store")}>{t("action.browse")}</Button>
    return null
  }

  const versionLabel = state.native.version ? t("connection.version", { version: state.native.version }) : t("connection.detected")

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader title={t("connection.title")} onBack={pop} backLabel={t("action.back")} />
      <ScreenBody className="pt-1">
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <DiscordAvatar profile={connection === "discord" ? profile : null} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label-lg font-medium">
                {connection === "discord" && profile ? (profile.globalName ?? profile.username) : t(`connection.state.${connection}`)}
              </span>
              <span className="flex items-center gap-1.5 truncate text-label-md text-muted">
                {connection === "discord" ? (
                  <>
                    <LiveDot pulse={false} />
                    {profile ? t("connection.connectedAs", { username: profile.username }) : t("connection.state.discord")}
                  </>
                ) : (
                  t(`connection.hint.${connection}`)
                )}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" loading={busy === "reconnect"} icon={<RiRefreshLine className="size-4" />} onClick={() => void reconnect("reconnect")}>
              {t("connection.reconnect")}
            </Button>
            <Button variant="secondary" size="sm" loading={busy === "restart"} icon={<RiRestartLine className="size-4" />} onClick={() => void reconnect("restart")}>
              {t("connection.restart")}
            </Button>
          </div>
        </Card>

        <Section title={t("connection.desktop")}>
          <Group>
            <Row
              leading={<RiComputerLine className="size-[18px] text-muted" />}
              title={t("connection.desktopApp")}
              description={state.native.connected ? versionLabel : t("connection.notDetected")}
              trailing={
                state.native.connected ? (
                  <RiCheckboxCircleFill className="size-5 text-success" />
                ) : (
                  <Button size="sm" icon={<RiDownloadLine className="size-4" />} onClick={() => openUrl(HOST_DOWNLOAD_URL)}>
                    {t("action.download")}
                  </Button>
                )
              }
            />
            <Row title={t("connection.status")} trailing={<span className="max-w-48 truncate text-label-md text-muted">{state.native.status}</span>} />
          </Group>
        </Section>

        <Section title={t("connection.checklist")}>
          <Group>
            {CHECKS.map((check) => {
              const ok = diagnostic?.[check.key]
              const optional = check.key === "activityDetected"
              return (
                <Row
                  key={check.key}
                  align="start"
                  leading={
                    ok ? (
                      <RiCheckboxCircleFill className="size-5 text-success" />
                    ) : optional ? (
                      <RiErrorWarningFill className="size-5 text-line-strong" />
                    ) : (
                      <RiCloseCircleFill className="size-5 text-danger" />
                    )
                  }
                  title={t(check.label)}
                  description={ok ? undefined : t(check.hint)}
                  trailing={!ok && fix(check.key)}
                />
              )
            })}
          </Group>
        </Section>

        <Button variant="secondary" icon={<RiFileList3Line className="size-4" />} onClick={() => push({ name: "logs" })}>
          {t("connection.openLogs")}
        </Button>
      </ScreenBody>
    </div>
  )
}
