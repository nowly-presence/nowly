import type { FC } from "react";
import type { GuidedStep } from "@/features/onboarding/onboarding.types";
import { stepDotClass } from "@/features/onboarding/onboarding.utils";

type Props = {
  activeIndex: number;
  allDone: boolean;
  devReplayOnboarding: boolean;
  onSelect: (index: number) => void;
  steps: GuidedStep[];
};

export const ProgressDots: FC<Props> = ({
  activeIndex,
  allDone,
  devReplayOnboarding,
  onSelect,
  steps,
}) => (
  <div className="mt-5 flex justify-center gap-1.5">
    {steps.map((step, dotIndex) => {
      const dotClassName = `h-1.5 rounded-full transition-all ${stepDotClass(dotIndex === activeIndex, step.status === "success")}`;

      return devReplayOnboarding ? (
        <button
          key={step.title}
          type="button"
          aria-label={step.title}
          title={step.title}
          onClick={() => onSelect(dotIndex)}
          className={`${dotClassName} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40`}
        />
      ) : (
        <span
          key={step.title}
          className={dotClassName}
        />
      );
    })}
    {!devReplayOnboarding && allDone ? <span className="h-1.5 w-5 rounded-full bg-accent transition-all" /> : null}
  </div>
);