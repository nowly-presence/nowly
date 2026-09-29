import type { ReactNode } from "react"
import { RiArrowLeftLine } from "@remixicon/react"
import { cn } from "@/ui/cn"

export const ScreenTitle = ({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) => (
  <div className="flex items-end justify-between gap-3 px-1 pt-2">
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className="text-headline-sm font-medium tracking-[-0.3px] text-ink">{title}</h1>
      {subtitle && <p className="text-body-sm text-muted">{subtitle}</p>}
    </div>
    {action}
  </div>
)

export const BackHeader = ({ title, onBack, backLabel, action }: { title?: string; onBack: () => void; backLabel: string; action?: ReactNode }) => (
  <header className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-canvas/90 px-2 backdrop-blur-md">
    <button
      type="button"
      onClick={onBack}
      aria-label={backLabel}
      className="flex size-9 items-center justify-center rounded-md text-ink transition-colors hover:bg-hover active:bg-press"
    >
      <RiArrowLeftLine className="size-5" />
    </button>
    {title && <span className="min-w-0 flex-1 truncate text-label-lg font-medium text-ink">{title}</span>}
    {!title && <span className="flex-1" />}
    {action}
  </header>
)

export const ScreenBody = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("flex animate-enter flex-col gap-6 px-4 pt-2 pb-28", className)}>{children}</div>
)
