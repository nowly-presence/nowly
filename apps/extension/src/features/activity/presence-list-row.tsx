import { PresenceIcon } from "@/components/shared/presence-icon"
import { useI18n } from "@/hooks/i18n-provider"
import type { PresenceStatus } from "@/lib/presence-status"
import type { StoredPresence } from "@/shared/types"
import { Badge } from "@/ui/badge"
import { cn } from "@/ui/cn"
import { Row } from "@/ui/row"
import { Switch } from "@/ui/switch"
import type { StatusLine } from "@/features/activity/presence-status-text"
import { PresenceStatusLabel } from "@/features/activity/presence-status-label"

type PresenceListRowProps = {
  slug: string
  stored: StoredPresence
  status: PresenceStatus
  line: StatusLine
  hasUpdate: boolean
  onOpen: () => void
  onToggle: (enabled: boolean) => void
}

export const PresenceListRow = ({ slug, stored, status, line, hasUpdate, onOpen, onToggle }: PresenceListRowProps) => {
  const { t } = useI18n()
  return (
    <Row
      onClick={onOpen}
      leading={
        <PresenceIcon slug={slug} name={stored.metadata.name} color={stored.metadata.color} size={36} className={cn(!stored.enabled && "opacity-50 grayscale")} />
      }
      title={
        <span className="flex items-center gap-2">
          <span className="truncate">{stored.metadata.name}</span>
          {hasUpdate && <Badge tone="primary">{t("badge.update")}</Badge>}
        </span>
      }
      description={<PresenceStatusLabel status={status} line={line} />}
      trailing={<Switch checked={stored.enabled} label={stored.metadata.name} onChange={onToggle} />}
    />
  )
}
