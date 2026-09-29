import type { ReactNode } from "react"
import { cn } from "@/ui/cn"

type FieldRowProps = {
  title: ReactNode
  description?: ReactNode
  note?: ReactNode
  children: ReactNode
  layout?: "inline" | "stacked"
  spacing?: "tight" | "relaxed"
  controlClassName?: string
}

export const FieldRow = ({ title, description, note, children, layout = "inline", spacing = "tight", controlClassName }: FieldRowProps) => (
  <div className="px-4 py-3">
    <div className={cn("flex", layout === "inline" ? "items-center justify-between gap-3" : cn("flex-col", spacing === "tight" ? "gap-2" : "gap-3"))}>
      <div className="flex min-w-0 flex-col">
        <span className="text-label-lg font-medium">{title}</span>
        {description && <span className="text-label-md text-muted">{description}</span>}
      </div>
      <div className={cn(layout === "inline" && "shrink-0", controlClassName)}>{children}</div>
    </div>
    {note && <p className="mt-2.5 text-label-sm text-muted italic">{note}</p>}
  </div>
)
