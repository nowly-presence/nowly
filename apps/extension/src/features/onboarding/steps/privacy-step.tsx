import { useState } from "react"
import { RiCheckLine, RiShieldCheckLine } from "@remixicon/react"
import { openUrl, siteUrl } from "@/shared/browser-links"
import { Button } from "@/ui/button"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { OnboardingStepLayout } from "@/features/onboarding/onboarding-step-layout"

export const PrivacyStep = ({ onDone }: { onDone: () => void }) => {
  const { t } = useI18n()
  const [busy, setBusy] = useState<"yes" | "no" | null>(null)

  const choose = async (granted: boolean) => {
    setBusy(granted ? "yes" : "no")
    await sendMessage("SET_ANALYTICS_CONSENT", { granted }).catch(() => {})
    onDone()
  }

  return (
    <OnboardingStepLayout
      icon={<RiShieldCheckLine className="size-5" />}
      title={t("onboarding.privacyTitle")}
      description={t("onboarding.privacyDescription")}
      footer={
        <>
          <Button onClick={() => void choose(true)} loading={busy === "yes"} className="w-full">
            {t("onboarding.privacyYes")}
          </Button>
          <Button variant="ghost" onClick={() => void choose(false)} loading={busy === "no"} className="w-full">
            {t("onboarding.privacyNo")}
          </Button>
        </>
      }
    >
      <ul className="flex flex-col gap-3">
        {[t("onboarding.privacyPoint1"), t("onboarding.privacyPoint2"), t("onboarding.privacyPoint3")].map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-body-sm">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <RiCheckLine className="size-3" />
            </span>
            {point}
          </li>
        ))}
      </ul>
      <Button variant="link" className="self-start" onClick={() => openUrl(siteUrl("/privacy"))}>
        {t("onboarding.privacyPolicy")}
      </Button>
    </OnboardingStepLayout>
  )
}
