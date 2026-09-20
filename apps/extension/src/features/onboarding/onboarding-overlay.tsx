import { RiCheckboxCircleFill } from "@remixicon/react"
import { useEffect, useRef, useState } from "react"
import { Header } from "@/components/layout/header"
import { trackUiEvent } from "@/lib/analytics"
import { sendMessage } from "@/lib/messages"
import { LocalePicker } from "@/features/onboarding/locale-picker"
import { OnboardingFooter } from "@/features/onboarding/onboarding-footer"
import type { GuidedStep, OnboardingOverlayProps } from "@/features/onboarding/onboarding.types"
import { ProgressDots } from "@/features/onboarding/progress-dots"
import { StepIcon } from "@/features/onboarding/step-icon"
import { useOnboardingSteps } from "@/features/onboarding/use-onboarding-steps"
import { t } from "@/shared/i18n"

const NATIVE_STATUS_POLL_MS = 2500

export const OnboardingOverlay = ({
  activity,
  nativeStatus,
  userScripts,
  devReplayOnboarding = false,
  onboardingCompleted,
  localePreference,
  onLocaleChange,
  onConnectNative,
  onComplete,
  onSkipTour,
  presences,
  settings,
  hostVersionInfo,
}: OnboardingOverlayProps): React.JSX.Element | null => {
  // The shared provider only refreshes native status on visibility/focus,
  // too coarse while the user is actively waiting for the desktop app to
  // connect here. Poll locally, bounded to this component's own lifetime
  // (stops the moment onboarding completes) instead of the old global 1.5s
  // interval that ran for the whole session regardless of what was on screen.
  const [liveNativeStatus, setLiveNativeStatus] = useState(nativeStatus)

  useEffect(() => {
    setLiveNativeStatus(nativeStatus)
  }, [nativeStatus])

  useEffect(() => {
    if (onboardingCompleted) return

    let cancelled = false
    const interval = window.setInterval(() => {
      void sendMessage("GET_NATIVE_STATUS").then((status) => {
        if (!cancelled && status) setLiveNativeStatus(status)
      })
    }, NATIVE_STATUS_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [onboardingCompleted])

  const steps = useOnboardingSteps({ activity, nativeStatus: liveNativeStatus, userScripts, onConnectNative, presences, hostVersionInfo })

  const pendingIndex = steps.findIndex((step) => step.status !== "success")
  const allDone = pendingIndex === -1
  const currentIndex = allDone ? steps.length : pendingIndex
  const progressSteps = steps.slice(1)
  const progressIndex = allDone ? progressSteps.length : Math.max(0, currentIndex - 1)
  const [replayIndex, setReplayIndex] = useState(0)
  const replayMaxIndex = Math.max(0, progressSteps.length - 1)
  const clampedReplayIndex = Math.min(replayIndex, replayMaxIndex)
  const activeProgressIndex = devReplayOnboarding ? clampedReplayIndex : progressIndex
  const canReplayPrevious = clampedReplayIndex > 0
  const canReplayNext = clampedReplayIndex < replayMaxIndex
  const [readyCountdown, setReadyCountdown] = useState(5)
  const onCompleteRef = useRef(onComplete)
  const startedTrackedRef = useRef(false)
  const gateSeenTrackedRef = useRef(false)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (onboardingCompleted || startedTrackedRef.current) return
    startedTrackedRef.current = true
    trackUiEvent("onboarding_started", { source: "extension_onboarding" })
  }, [onboardingCompleted])

  useEffect(() => {
    if (gateSeenTrackedRef.current || allDone || pendingIndex !== 0) return
    gateSeenTrackedRef.current = true
    trackUiEvent("onboarding_gate_seen", { payload: { gate: "userScripts" } })
  }, [allDone, pendingIndex])

  useEffect(() => {
    if (devReplayOnboarding) setReplayIndex(0)
  }, [devReplayOnboarding])

  useEffect(() => {
    if (!devReplayOnboarding) return
    setReplayIndex((current) => Math.min(current, replayMaxIndex))
  }, [devReplayOnboarding, replayMaxIndex])

  useEffect(() => {
    if (devReplayOnboarding || !allDone || onboardingCompleted) {
      setReadyCountdown(5)
      return
    }

    setReadyCountdown(5)
    const timer = window.setInterval(() => {
      setReadyCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          trackUiEvent("onboarding_completed", { source: "extension_onboarding" })
          onCompleteRef.current()
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [allDone, devReplayOnboarding, onboardingCompleted])

  const replayStep = progressSteps[clampedReplayIndex] ?? steps[0]
  const currentStep: GuidedStep = devReplayOnboarding
    ? replayStep
    : allDone
      ? {
          actions: undefined,
          details: <p className="mt-3 text-sm leading-5 text-muted-foreground">{t("onboarding-ready-message")}</p>,
          icon: RiCheckboxCircleFill,
          status: "success",
          title: t("onboarding-ready-title"),
          message: t("onboarding-ready-countdown", { seconds: String(readyCountdown) }),
        }
      : steps[pendingIndex]

  if (onboardingCompleted) return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background font-sans text-foreground">
      {settings.backgroundAnimation !== false ? <div className="sidepanel-bg absolute inset-0" aria-hidden /> : null}

      <div className="relative z-1 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-3 pt-3">
          <div className="min-w-0 flex-1">
            <Header />
          </div>
          <LocalePicker localePreference={localePreference} onLocaleChange={onLocaleChange} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-3 py-4">
          <section className="rounded-xl border border-border bg-card p-5 text-center">
            <StepIcon icon={currentStep.icon} status={currentStep.status} />
            <h1 className="mt-4 text-base font-semibold text-foreground">{currentStep.title}</h1>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">{currentStep.message}</p>
            {currentStep.details}
            {currentStep.actions ? <div className="mt-5 flex justify-center">{currentStep.actions}</div> : null}
            <ProgressDots activeIndex={activeProgressIndex} allDone={allDone} devReplayOnboarding={devReplayOnboarding} onSelect={setReplayIndex} steps={progressSteps} />
          </section>
        </div>

        <OnboardingFooter
          canReplayNext={canReplayNext}
          canReplayPrevious={canReplayPrevious}
          devReplayOnboarding={devReplayOnboarding}
          onNext={() => setReplayIndex((current) => Math.min(replayMaxIndex, current + 1))}
          onPrevious={() => setReplayIndex((current) => Math.max(0, current - 1))}
          onSkipTour={onSkipTour}
          showSkip={!allDone}
        />
      </div>
    </div>
  )
}
