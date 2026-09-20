import { stepDotClass } from "@/features/onboarding/onboarding.utils"
import type { GuidedStep } from "@/features/onboarding/onboarding.types"
import { cn } from "@/ui/utils"

type Props = {
  activeIndex: number
  allDone: boolean
  devReplayOnboarding: boolean
  onSelect: (index: number) => void
  steps: GuidedStep[]
}

export const ProgressDots = ({ activeIndex, allDone, devReplayOnboarding, onSelect, steps }: Props): React.JSX.Element => (
  <div className="mt-5 flex justify-center gap-1.5">
    {steps.map((step, dotIndex) => {
      const dotClassName = cn("h-1.5 rounded-full transition-all", stepDotClass(dotIndex === activeIndex, step.status === "success"))

      return devReplayOnboarding ? (
        <button key={step.title} type="button" aria-label={step.title} title={step.title} onClick={() => onSelect(dotIndex)} className={cn(dotClassName, "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50")} />
      ) : (
        <span key={step.title} className={dotClassName} />
      )
    })}
    {!devReplayOnboarding && allDone ? <span className="h-1.5 w-5 rounded-full bg-accent transition-all" /> : null}
  </div>
)
