import type { ComponentType } from "react"
import type { StepStatus } from "@/features/onboarding/onboarding.types"
import { cn } from "@/ui/utils"

type Props = {
  icon: ComponentType<{ className?: string }>
  status: StepStatus
}

export const StepIcon = ({ icon: Icon, status }: Props): React.JSX.Element => (
  <div
    className={cn(
      "mx-auto flex size-12 items-center justify-center rounded-xl",
      status === "success" ? "bg-success/10 text-success" : "bg-accent/10 text-accent",
    )}
  >
    <Icon className="size-6" />
  </div>
)
