import { RiCheckLine, RiComputerLine, RiDiscordLine } from "@remixicon/react"
import { openUrl } from "@/shared/browser-links"
import { HOST_DOWNLOAD_URL } from "@/shared/constants"
import { Button, Spinner } from "@/ui/button"
import { LiveDot } from "@/ui/live-dot"
import { DiscordAvatar } from "@/components/shared/discord-avatar"
import { Card, Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { useI18n } from "@/hooks/i18n-provider"
import { connectionOf } from "@/lib/presence-status"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { OnboardingStepLayout } from "@/features/onboarding/onboarding-step-layout"
import { PermissionStatus } from "@/features/onboarding/permission-status"
import { ChromeOsWaitlistForm } from "@/features/onboarding/chromeos-waitlist-form"
import { useIsChromeOs } from "@/features/onboarding/use-is-chrome-os"

export const DesktopStep = ({ onNext }: { onNext: () => void }) => {
  const { t } = useI18n()
  const { state } = useExtensionState()
  const connection = connectionOf(state.native)
  const profile = state.onboarding.nativeProfile
  const ok = connection === "discord"
  const versionLabel = state.native.version ? t("connection.version", { version: state.native.version }) : t("connection.detected")
  const isChromeOs = useIsChromeOs()

  if (isChromeOs) {
    return (
      <OnboardingStepLayout
        icon={<RiComputerLine className="size-5" />}
        title={t("onboarding.chromeOsTitle")}
        description={t("onboarding.chromeOsDescription")}
        footer={
          <Button onClick={onNext} variant="secondary" className="w-full">
            {t("onboarding.later")}
          </Button>
        }
      >
        <ChromeOsWaitlistForm />
      </OnboardingStepLayout>
    )
  }

  return (
    <OnboardingStepLayout
      icon={<RiDiscordLine className="size-5" />}
      title={t("onboarding.desktopTitle")}
      description={t("onboarding.desktopDescription")}
      footer={
        <Button onClick={onNext} className="w-full" variant={ok ? "primary" : "secondary"}>
          {ok ? t("action.continue") : t("onboarding.later")}
        </Button>
      }
    >
      {ok ? (
        <Card className="flex items-center gap-3 p-4">
          <DiscordAvatar profile={profile} size={44} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-label-lg font-medium">{profile?.globalName ?? profile?.username ?? t("connection.state.discord")}</span>
            <span className="flex items-center gap-1.5 text-label-md text-success">
              <LiveDot />
              {profile ? t("connection.connectedAs", { username: profile.username }) : t("connection.state.discord")}
            </span>
          </div>
        </Card>
      ) : (
        <Group>
          <Row
            leading={<RiComputerLine className="size-5 text-muted" />}
            title={t("connection.desktopApp")}
            description={state.native.connected ? versionLabel : t("onboarding.desktopMissing")}
            trailing={
              state.native.connected ? (
                <RiCheckLine className="size-5 text-success" />
              ) : (
                <Button size="sm" onClick={() => openUrl(HOST_DOWNLOAD_URL)}>
                  {t("action.download")}
                </Button>
              )
            }
          />
          <Row
            leading={<RiDiscordLine className="size-5 text-muted" />}
            title="Discord"
            description={state.native.connected ? t("onboarding.discordOpen") : t("onboarding.discordAfter")}
            trailing={state.native.connected ? <Spinner className="text-muted" /> : null}
          />
        </Group>
      )}
      {!ok && <PermissionStatus ok={false} okLabel="" waitingLabel={t("onboarding.desktopWaiting")} />}
    </OnboardingStepLayout>
  )
}
