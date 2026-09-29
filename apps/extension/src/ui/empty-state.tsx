import { type ReactNode } from "react"
import { cn } from "@/ui/cn"

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) => (
  <div className={cn("flex flex-col items-center gap-3 px-6 py-8 text-center", className)}>
    {icon && <span className="flex size-10 items-center justify-center rounded-md bg-hover text-muted">{icon}</span>}
    <div className="flex flex-col gap-1">
      <p className="text-label-lg font-medium text-ink">{title}</p>
      {description && <p className="mx-auto max-w-64 text-body-sm text-muted text-balance">{description}</p>}
    </div>
    {action}
  </div>
)
