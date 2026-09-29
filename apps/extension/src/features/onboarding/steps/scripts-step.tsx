import { useEffect } from "react"
import { RiCodeBoxLine } from "@remixicon/react"
import { extensionDetailsUrl, openUrl } from "@/shared/browser-links"
import { Button } from "@/ui/button"
import { useI18n } from "@/hooks/i18n-provider"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { OnboardingStepLayout } from "@/features/onboarding/onboarding-step-layout"
import { PermissionStatus } from "@/features/onboarding/permission-status"

export const ScriptsStep = ({ onNext }: { onNext: () => void }) => {
  const { t } = useI18n()
  const { state, refresh } = useExtensionState()
  const enabled = state.userScripts.enabled
  const firefox = import.meta.env.BROWSER === "firefox"

  useEffect(() => {
    const id = window.setInterval(() => void refresh.userScripts(), 1200)
    return () => window.clearInterval(id)
  }, [refresh])

  const grant = async () => {
    await chrome.permissions.request({ permissions: ["userScripts"] as chrome.runtime.ManifestPermission[] }).catch(() => false)
    await refresh.userScripts()
  }

  return (
    <OnboardingStepLayout
      icon={<RiCodeBoxLine className="size-5" />}
      title={t("onboarding.scriptsTitle")}
      description={firefox ? t("onboarding.scriptsDescriptionFirefox") : t("onboarding.scriptsDescription")}
      footer={
        <>
          <Button onClick={onNext} className="w-full" variant={enabled ? "primary" : "secondary"}>
            {enabled ? t("action.continue") : t("onboarding.later")}
          </Button>
        </>
      }
    >
      {!firefox && (
        <ol className="flex flex-col gap-3">
          {[t("onboarding.scriptsStep1"), t("onboarding.scriptsStep2"), t("onboarding.scriptsStep3")].map((text, position) => (
            <li key={text} className="flex items-start gap-3 text-body-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-label-md font-medium tabular-nums">{position + 1}</span>
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-col gap-2">
        {!enabled &&
          (firefox ? (
            <Button onClick={() => void grant()}>{t("onboarding.grant")}</Button>
          ) : (
            <Button onClick={() => openUrl(extensionDetailsUrl())}>{t("onboarding.openDetails")}</Button>
          ))}
        <PermissionStatus ok={enabled} okLabel={t("onboarding.scriptsOk")} waitingLabel={t("onboarding.scriptsWaiting")} />
      </div>
    </OnboardingStepLayout>
  )
}
