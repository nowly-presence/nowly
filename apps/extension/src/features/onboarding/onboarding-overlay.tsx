import { Header } from "@/components/layout/header";
import { t } from "@/shared/i18n";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { LocalePicker } from "@/features/onboarding/locale-picker";
import { OnboardingFooter } from "@/features/onboarding/onboarding-footer";
import type { GuidedStep, OnboardingOverlayProps } from "@/features/onboarding/onboarding.types";
import { ProgressDots } from "@/features/onboarding/progress-dots";
import { StepIcon } from "@/features/onboarding/step-icon";
import { useOnboardingSteps } from "@/features/onboarding/use-onboarding-steps";

export const OnboardingOverlay: FC<OnboardingOverlayProps> = ({
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
  onSettingsChange,
  supporter = false,
}): ReactElement | null => {
  const steps = useOnboardingSteps({
    activity,
    nativeStatus,
    userScripts,
    onConnectNative,
    presences,
    settings,
    onSettingsChange,
  });

  const pendingIndex = steps.findIndex((step) => step.status !== "success");
  const allDone = pendingIndex === -1;
  const currentIndex = allDone ? steps.length : pendingIndex;
  const progressSteps = steps.slice(1);
  const progressIndex = allDone ? progressSteps.length : Math.max(0, currentIndex - 1);
  const [replayIndex, setReplayIndex] = useState(0);
  const replayMaxIndex = Math.max(0, progressSteps.length - 1);
  const clampedReplayIndex = Math.min(replayIndex, replayMaxIndex);
  const activeProgressIndex = devReplayOnboarding ? clampedReplayIndex : progressIndex;
  const canReplayPrevious = clampedReplayIndex > 0;
  const canReplayNext = clampedReplayIndex < replayMaxIndex;
  const [readyCountdown, setReadyCountdown] = useState(5);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (devReplayOnboarding) {
      setReplayIndex(0);
    }
  }, [devReplayOnboarding]);

  useEffect(() => {
    if (!devReplayOnboarding) return;
    setReplayIndex((current) => Math.min(current, replayMaxIndex));
  }, [devReplayOnboarding, replayMaxIndex]);

  useEffect(() => {
    if (devReplayOnboarding || !allDone || onboardingCompleted) {
      setReadyCountdown(5);
      return;
    }

    setReadyCountdown(5);
    const timer = window.setInterval(() => {
      setReadyCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          onCompleteRef.current();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [allDone, devReplayOnboarding, onboardingCompleted]);

  const replayStep = progressSteps[clampedReplayIndex] ?? steps[0];
  const currentStep: GuidedStep = devReplayOnboarding
    ? replayStep
    : allDone
      ? {
        actions: undefined,
        details: <p className="mt-2 text-xs leading-5 text-dim-foreground">{t("onboarding-ready-message")}</p>,
        icon: IconCircleCheckFilled,
        status: "success",
        title: t("onboarding-ready-title"),
        message: t("onboarding-ready-countdown", { seconds: String(readyCountdown) }),
      }
      : steps[pendingIndex];

  if (onboardingCompleted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-md" />
      <div className="pointer-events-auto absolute inset-0 flex min-h-0 flex-col p-3">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card/95 shadow-[0_18px_50px_rgba(0,0,0,.55)]">
          <div className="flex items-center border-b border-border px-4 py-3">
            <Header supporter={supporter} />
            <LocalePicker
              localePreference={localePreference}
              onLocaleChange={onLocaleChange}
            />
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center p-5 text-center">
            <div className="max-w-sm">
              <StepIcon icon={currentStep.icon} status={currentStep.status} />
              <h1 className="mt-4 text-lg font-semibold text-foreground">{currentStep.title}</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentStep.message}</p>
              {currentStep.details}
              {currentStep.actions ? (
                <div className="mt-5 flex justify-center">{currentStep.actions}</div>
              ) : null}
              <ProgressDots
                activeIndex={activeProgressIndex}
                allDone={allDone}
                devReplayOnboarding={devReplayOnboarding}
                onSelect={setReplayIndex}
                steps={progressSteps}
              />
            </div>
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
        </section>
      </div>
    </div>
  );
};
