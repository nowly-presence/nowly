import { useEffect, useState } from "react"
import { RiArrowLeftLine } from "@remixicon/react"
import { Wordmark } from "@/components/shared/wordmark"
import { cn } from "@/ui/cn"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage, track } from "@/lib/messages"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { WelcomeStep } from "@/features/onboarding/steps/welcome-step"
import { ScriptsStep } from "@/features/onboarding/steps/scripts-step"
import { DesktopStep } from "@/features/onboarding/steps/desktop-step"
import { PresencesStep } from "@/features/onboarding/steps/presences-step"
import { PrivacyStep } from "@/features/onboarding/steps/privacy-step"

const STEPS = ["welcome", "scripts", "desktop", "presences", "privacy"] as const
type Step = (typeof STEPS)[number]

export const OnboardingView = ({ theme }: { theme: "light" | "dark" }) => {
  const { t } = useI18n()
  const { refresh } = useExtensionState()
  const [step, setStep] = useState<Step>("welcome")
  const index = STEPS.indexOf(step)

  useEffect(() => {
    track("onboarding_started", { source: "extension_onboarding" })
  }, [])

  useEffect(() => {
    if (step !== "welcome") track("onboarding_gate_seen", { payload: { gate: step } })
  }, [step])

  const next = () => setStep(STEPS[Math.min(STEPS.length - 1, index + 1)])
  const back = () => setStep(STEPS[Math.max(0, index - 1)])
  const finish = async () => {
    await sendMessage("SET_ONBOARDING", { onboardingCompleted: true, devReplayOnboarding: false })
    await refresh.onboarding()
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between gap-3 px-4">
        {index > 0 ? (
          <button type="button" onClick={back} aria-label={t("action.back")} className="-ml-2 flex size-9 items-center justify-center rounded-md text-ink hover:bg-hover">
            <RiArrowLeftLine className="size-5" />
          </button>
        ) : (
          <Wordmark theme={theme} />
        )}
        <div className="flex items-center gap-1" aria-label={t("onboarding.progress", { step: index + 1, total: STEPS.length })}>
          {STEPS.map((value, position) => (
            <span
              key={value}
              className={cn("h-1 rounded-full transition-all duration-300", position === index ? "w-5 bg-primary" : position < index ? "w-2 bg-ink/40" : "w-2 bg-line-strong")}
            />
          ))}
        </div>
      </header>

      <div key={step} className="flex flex-1 animate-push flex-col px-4 pb-4">
        {step === "welcome" && <WelcomeStep onNext={next} />}
        {step === "scripts" && <ScriptsStep onNext={next} />}
        {step === "desktop" && <DesktopStep onNext={next} />}
        {step === "presences" && <PresencesStep onNext={next} />}
        {step === "privacy" && <PrivacyStep onDone={() => void finish()} />}
      </div>
    </div>
  )
}
