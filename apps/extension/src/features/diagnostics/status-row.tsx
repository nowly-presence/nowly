import { RiCheckboxCircleFill, RiCloseCircleLine, RiLoader2Line } from "@remixicon/react"
import type { ReactNode } from "react"

export type RowStatus = "loading" | "success" | "error"

const StatusIcon = ({ status }: { status: RowStatus }): React.JSX.Element => {
  if (status === "loading") return <RiLoader2Line className="size-4 animate-spin text-muted-foreground" />
  if (status === "success") return <RiCheckboxCircleFill className="size-4 text-success" />
  return <RiCloseCircleLine className="size-4 text-destructive" />
}

type Props = {
  action?: ReactNode
  label: string
  message: string
  status: RowStatus
}

export const StatusRow = ({ action, label, message, status }: Props): React.JSX.Element => (
  <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
    <span className="mt-0.5 shrink-0">
      <StatusIcon status={status} />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{message}</p>
      {action ? <div className="mt-2 flex flex-wrap gap-1.5">{action}</div> : null}
    </div>
  </div>
)
