import { RiRefreshLine, RiRestartLine, RiTerminalLine } from "@remixicon/react"
import { useEffect, useState } from "react"
import { SettingRow } from "@/features/settings/setting-row"
import { PresenceZipDrop } from "@/features/settings/presence-zip-drop"
import { formatRelativeTime } from "@/lib/format"
import { API_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import type { ExtensionSettings, NativeStatus, PresenceDebug } from "@/shared/types"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion"
import { Button } from "@/ui/button"
import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { Separator } from "@/ui/separator"
import { Switch } from "@/ui/switch"
import { cn } from "@/ui/utils"

type Props = {
  settings: ExtensionSettings
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void
  isUnpacked: boolean
  debug: PresenceDebug | null
  nativeStatus: NativeStatus
  isCheckingUpdates: boolean
  onCheckUpdates: () => void
  onReplayOnboarding: () => void
}

export const DeveloperSection = ({ settings, onSettingsChange, isUnpacked, debug, nativeStatus, isCheckingUpdates, onCheckUpdates, onReplayOnboarding }: Props): React.JSX.Element => {
  const developerModeEnabled = settings.developerMode ?? isUnpacked
  const hasNativeIssue = !nativeStatus.connected || !nativeStatus.discordConnected
  const nativeIssueMessage = !nativeStatus.connected ? t("diagnostic-host-missing-message") : !nativeStatus.discordConnected ? t("diagnostic-discord-closed-message") : nativeStatus.status
  const updatedAt = formatRelativeTime(debug?.updatedAt)

  const [apiUrl, setApiUrl] = useState(settings.customApiBaseUrl ?? API_BASE_URL)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setApiUrl(settings.customApiBaseUrl ?? API_BASE_URL)
  }, [settings.customApiBaseUrl])

  const handleSaveApiUrl = (): void => {
    const trimmed = apiUrl.trim()
    onSettingsChange({ customApiBaseUrl: trimmed !== API_BASE_URL ? trimmed : undefined })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <AccordionItem value="developer">
      <AccordionTrigger className="px-4">{t("settings-group-developer")}</AccordionTrigger>
      <AccordionContent className="pb-0">
        <SettingRow
          title={t("developer-mode")}
          description={t("developer-mode-description")}
          control={<Switch checked={developerModeEnabled} onCheckedChange={(checked) => onSettingsChange({ developerMode: checked })} />}
        />

        {!isUnpacked ? (
          <div className="px-4 py-3.5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("check-updates")}</p>
            <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("check-updates-description")}</p>
            <Button variant="outline" onClick={onCheckUpdates} disabled={isCheckingUpdates} className="w-full">
              <RiRefreshLine className={cn(isCheckingUpdates && "animate-spin")} />
              {t("check-updates")}
            </Button>
          </div>
        ) : null}

        {developerModeEnabled ? (
          <div className="flex flex-col gap-4 px-4 py-3.5 text-xs leading-5 text-muted-foreground">
            <Separator />

            <div className="flex items-center gap-2 text-foreground">
              <RiTerminalLine className="size-3.5 text-muted-foreground" />
              <span className="font-semibold">{t("debug")}</span>
            </div>
            {debug ? (
              <p className="wrap-break-word">
                <span className="font-semibold text-foreground">{debug.stage}</span> - {debug.message}
                {updatedAt ? <span className="text-muted-foreground/70"> - {updatedAt}</span> : null}
              </p>
            ) : (
              <p>{t("debug-idle")}</p>
            )}
            {hasNativeIssue ? (
              <p className="wrap-break-word">
                <span className="font-semibold text-foreground">{t("debug-native-label")}</span> - {nativeIssueMessage}
              </p>
            ) : null}

            <Separator />

            <div>
              <p className="font-semibold text-foreground">{t("developer-onboarding-reset-title")}</p>
              <p className="mb-2">{t("developer-onboarding-reset-description")}</p>
              <Button variant="outline" size="sm" onClick={onReplayOnboarding}>
                <RiRestartLine className="size-3.5" />
                {t("developer-onboarding-reset-action")}
              </Button>
            </div>

            <Separator />

            <PresenceZipDrop />

            <Separator />

            <div>
              <Label className="text-xs font-medium text-muted-foreground">{t("api-base-url")}</Label>
              <p className="mt-0.5 mb-1.5">{t("api-base-url-description")}</p>
              <div className="flex gap-1.5">
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveApiUrl()
                  }}
                  placeholder={API_BASE_URL}
                  className="min-w-0 flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleSaveApiUrl}>
                  {saved ? <span className="text-success">OK</span> : t("save")}
                </Button>
                {apiUrl.trim() !== API_BASE_URL ? (
                  <Button variant="outline" size="sm" title={t("reset")} onClick={() => setApiUrl(API_BASE_URL)}>
                    ✕
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  )
}
