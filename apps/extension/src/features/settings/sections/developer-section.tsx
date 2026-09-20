import { RiListUnordered, RiRefreshLine, RiRestartLine, RiTerminalLine } from "@remixicon/react"
import { useEffect, useState } from "react"
import { HeadingText } from "@/components/shared/heading-text"
import { SettingRow } from "@/features/settings/setting-row"
import { SettingsBlock } from "@/features/settings/settings-block"
import { SettingsSectionHeader } from "@/features/settings/settings-section-header"
import { PresenceZipDrop } from "@/features/settings/presence-zip-drop"
import { formatRelativeTime } from "@/lib/format"
import { API_BASE_URL } from "@/shared/constants"
import { t } from "@/shared/i18n"
import type { ExtensionSettings, NativeStatus, PresenceDebug } from "@/shared/types"
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
  onOpenLogs: () => void
  onBack: () => void
}

export const DeveloperSection = ({
  settings,
  onSettingsChange,
  isUnpacked,
  debug,
  nativeStatus,
  isCheckingUpdates,
  onCheckUpdates,
  onReplayOnboarding,
  onOpenLogs,
  onBack,
}: Props): React.JSX.Element => {
  const developerModeEnabled = settings.developerMode ?? isUnpacked
  const hasNativeIssue = !nativeStatus.connected || !nativeStatus.discordConnected
  const nativeIssueMessage = !nativeStatus.connected
    ? t("diagnostic-host-missing-message")
    : !nativeStatus.discordConnected
      ? t("diagnostic-discord-closed-message")
      : nativeStatus.status
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
    <div className="flex flex-col gap-3">
      <SettingsSectionHeader
        title={t("settings-group-developer")}
        onBack={onBack}
      />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <SettingRow
          title={t("developer-mode")}
          description={t("developer-mode-description")}
          controlId="developer-mode-toggle"
          control={
            <Switch
              id="developer-mode-toggle"
              checked={developerModeEnabled}
              onCheckedChange={(checked) => onSettingsChange({ developerMode: checked })}
            />
          }
        />

        {!isUnpacked ? (
          <SettingRow
            title={t("check-updates")}
            description={t("check-updates-description")}
          >
            <Button
              variant="outline"
              onClick={onCheckUpdates}
              disabled={isCheckingUpdates}
              className="w-full"
            >
              <RiRefreshLine className={cn(isCheckingUpdates && "animate-spin")} />
              {t("check-updates")}
            </Button>
          </SettingRow>
        ) : null}

        {developerModeEnabled ? (
          <SettingsBlock className="flex flex-col gap-4 text-xs leading-5 text-muted-foreground">
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

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLogs}
            >
              <RiListUnordered className="size-3.5" />
              {t("runtime-logs-title")}
            </Button>

            <Separator />

            <div>
              <HeadingText
                title={t("developer-onboarding-reset-title")}
                description={t("developer-onboarding-reset-description")}
                className="mb-2"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onReplayOnboarding}
              >
                <RiRestartLine className="size-3.5" />
                {t("developer-onboarding-reset-action")}
              </Button>
            </div>

            {isUnpacked ? (
              <>
                <Separator />
                <PresenceZipDrop />
              </>
            ) : null}

            <Separator />

            <div>
              <Label
                htmlFor="api-base-url-input"
                className="text-xs font-medium text-muted-foreground"
              >
                {t("api-base-url")}
              </Label>
              <p className="mt-0.5 mb-1.5">{t("api-base-url-description")}</p>
              <div className="flex gap-1.5">
                <Input
                  id="api-base-url-input"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveApiUrl()
                  }}
                  placeholder={API_BASE_URL}
                  className="min-w-0 flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveApiUrl}
                >
                  {saved ? <span className="text-success">OK</span> : t("save")}
                </Button>
                {apiUrl.trim() !== API_BASE_URL ? (
                  <Button
                    variant="outline"
                    size="sm"
                    title={t("reset")}
                    onClick={() => setApiUrl(API_BASE_URL)}
                  >
                    ✕
                  </Button>
                ) : null}
              </div>
            </div>
          </SettingsBlock>
        ) : null}
      </div>
    </div>
  )
}
