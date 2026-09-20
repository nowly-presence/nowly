import { t } from "@/shared/i18n"
import { Button } from "@/ui/button"

type Props = {
  canReplayNext: boolean
  canReplayPrevious: boolean
  devReplayOnboarding: boolean
  onNext: () => void
  onPrevious: () => void
  onSkipTour: () => void
  showSkip: boolean
}

export const OnboardingFooter = ({ canReplayNext, canReplayPrevious, devReplayOnboarding, onNext, onPrevious, onSkipTour, showSkip }: Props): React.JSX.Element => {
  if (!devReplayOnboarding && !showSkip) {
    return <div className="h-3 shrink-0" />
  }

  return (
    <nav className="shrink-0 px-3 pb-3">
      <div className={devReplayOnboarding ? "grid grid-cols-3 gap-1 overflow-hidden rounded-xl border border-border bg-card p-1" : "grid grid-cols-1 overflow-hidden rounded-xl border border-border bg-card"}>
        {devReplayOnboarding ? (
          <>
            <Button variant="ghost" size="sm" disabled={!canReplayPrevious} onClick={onPrevious}>
              {t("onboarding-previous")}
            </Button>
            <Button variant="ghost" size="sm" onClick={onSkipTour}>
              {t("onboarding-finish")}
            </Button>
            <Button variant="ghost" size="sm" disabled={!canReplayNext} onClick={onNext}>
              {t("onboarding-next")}
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={onSkipTour} className="rounded-none">
            {t("onboarding-skip")}
          </Button>
        )}
      </div>
    </nav>
  )
}
