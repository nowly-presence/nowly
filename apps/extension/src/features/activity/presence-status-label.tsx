import type { PresenceStatus } from "@/lib/presence-status"
import { LiveDot } from "@/ui/live-dot"
import { cn } from "@/ui/cn"
import { toneClass, type StatusLine } from "@/features/activity/presence-status-text"

export const PresenceStatusLabel = ({ status, line, className }: { status: PresenceStatus; line: StatusLine; className?: string }) => (
  <span className={cn("flex items-center gap-1.5", toneClass[line.tone], className)}>
    {status.kind === "live" && <LiveDot />}
    <span className="truncate">{line.text}</span>
  </span>
)
