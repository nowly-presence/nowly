import { PresenceIcon } from "@/components/shared/presence-icon"
import type { PresenceStatus } from "@/lib/presence-status"
import type { StoredPresence } from "@/shared/types"
import { cn } from "@/ui/cn"
import { Switch } from "@/ui/switch"
import type { StatusLine } from "@/features/activity/presence-status-text"
import { PresenceStatusLabel } from "@/features/activity/presence-status-label"

type PresenceGridCardProps = {
  slug: string
  stored: StoredPresence
  status: PresenceStatus
  line: StatusLine
  onOpen: () => void
  onToggle: (enabled: boolean) => void
}

export const PresenceGridCard = ({ slug, stored, status, line, onOpen, onToggle }: PresenceGridCardProps) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(event) => event.key === "Enter" && onOpen()}
    className={cn(
      "flex cursor-pointer flex-col gap-3 rounded-sm border border-line bg-surface p-3 transition-colors hover:border-line-strong",
      !stored.enabled && "opacity-60",
    )}
  >
    <div className="flex items-start justify-between">
      <PresenceIcon slug={slug} name={stored.metadata.name} color={stored.metadata.color} size={36} />
      <Switch size="sm" checked={stored.enabled} label={stored.metadata.name} onChange={onToggle} />
    </div>
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-label-lg font-medium">{stored.metadata.name}</span>
      <PresenceStatusLabel status={status} line={line} className="truncate text-label-md" />
    </div>
  </div>
)
