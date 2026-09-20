import { PresenceTile } from "@/components/shared/presence-tile"
import { t } from "@/shared/i18n"
import type { StoredPresence } from "@/shared/types"
import { Badge } from "@/ui/badge"

type Props = {
  onOpen: (slug: string) => void
  presence: StoredPresence
  slug: string
  updateAvailable?: string
}

export const PresenceGridCard = ({ onOpen, presence, slug, updateAvailable }: Props): React.JSX.Element | null => {
  if (!presence?.metadata) return null

  const status = presence.enabled ? t("enabled") : t("disabled")

  return (
    <button
      type="button"
      onClick={() => onOpen(slug)}
      aria-label={`${presence.metadata.name}. ${status}`}
      className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-3 text-left outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      {updateAvailable ? (
        <Badge variant="default" className="mb-2 w-full justify-start bg-accent/10 text-accent">
          <span className="min-w-0 flex-1 truncate">{t("presence-update-available")}</span>
        </Badge>
      ) : null}

      <span className="flex min-w-0 items-start gap-2.5">
        <PresenceTile slug={slug} name={presence.metadata.name} dimmed={!presence.enabled} className="size-11" />
        <span className="min-w-0 flex-1">
          <span className={presence.enabled ? "block truncate text-sm font-semibold text-foreground" : "block truncate text-sm font-semibold text-muted-foreground"}>{presence.metadata.name}</span>
          <span className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: presence.enabled ? presence.metadata.color : "var(--muted-foreground)" }} />
            <span className="truncate">{status}</span>
          </span>
        </span>
      </span>
    </button>
  )
}
