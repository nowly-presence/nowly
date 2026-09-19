import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import type { FC } from "react";

type Props = {
  canReplayNext: boolean;
  canReplayPrevious: boolean;
  devReplayOnboarding: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkipTour: () => void;
  showSkip: boolean;
};

const dockItemClassName =
  "relative isolate flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted-foreground";

export const OnboardingFooter: FC<Props> = ({
  canReplayNext,
  canReplayPrevious,
  devReplayOnboarding,
  onNext,
  onPrevious,
  onSkipTour,
  showSkip,
}) => {
  if (!devReplayOnboarding && !showSkip) {
    return <div className="h-3 shrink-0" />;
  }

  return (
    <nav className="shrink-0 px-3 pb-3">
      <div className={`grid overflow-hidden rounded-xl border border-border bg-card ${devReplayOnboarding ? "grid-cols-3" : "grid-cols-1"}`}>
        {devReplayOnboarding ? (
          <>
            <Button
              variant="unstyled"
              size="none"
              disabled={!canReplayPrevious}
              onClick={onPrevious}
              className={dockItemClassName}
            >
              {t("onboarding-previous")}
            </Button>
            <Button
              variant="unstyled"
              size="none"
              onClick={onSkipTour}
              className={dockItemClassName}
            >
              {t("onboarding-finish")}
            </Button>
            <Button
              variant="unstyled"
              size="none"
              disabled={!canReplayNext}
              onClick={onNext}
              className={dockItemClassName}
            >
              {t("onboarding-next")}
            </Button>
          </>
        ) : (
          <Button
            variant="unstyled"
            size="none"
            onClick={onSkipTour}
            className={dockItemClassName}
          >
            {t("onboarding-skip")}
          </Button>
        )}
      </div>
    </nav>
  );
};
