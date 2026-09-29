import { RiCheckLine } from "@remixicon/react"
import { Spinner } from "@/ui/button"
import { cn } from "@/ui/cn"

export const PermissionStatus = ({ ok, okLabel, waitingLabel }: { ok: boolean; okLabel: string; waitingLabel: string }) => (
  <div className={cn("flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-label-lg font-medium transition-colors", ok ? "border-transparent bg-success-soft text-success" : "border-line bg-surface text-muted")}>
    {ok ? <RiCheckLine className="size-4" /> : <Spinner className="size-4" />}
    {ok ? okLabel : waitingLabel}
  </div>
)
