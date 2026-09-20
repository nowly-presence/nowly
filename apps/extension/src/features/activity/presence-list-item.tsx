import { RiCalendarLine, RiLoader2Line, RiSettings3Line } from "@remixicon/react"
import type { MouseEvent } from "react"
import { PresenceTile } from "@/components/shared/presence-tile"
import { PresenceContextMenu } from "@/features/activity/presence-context-menu"
import { t } from "@/shared/i18n"
import type { StoredPresence } from "@/shared/types"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Switch } from "@/ui/switch"

type Props = {
  onOpen: (slug: string) => void
  onOpenWebsite: (slug: string) => void
  onRemove: (slug: string) => void
  onSnooze: (slug: string) => void
  onUpdatePresence: (slug: string) => void
  updating?: boolean
  onSchedule: (slug: string) => void
  onToggle: (slug: string, enabled: boolean) => void
  presence: StoredPresence
  showSchedule: boolean
  slug: string
  updateAvailable?: string
}

export const PresenceListItem = ({
  onOpen,
  onOpenWebsite,
  onRemove,
  onSnooze,
  onUpdatePresence,
  updating = false,
  onSchedule,
  onToggle,
  presence,
  showSchedule,
  slug,
  updateAvailable,
}: Props): React.JSX.Element | null => {
  if (!presence?.metadata) return null

  const openUpdate = (event: MouseEvent): void => {
    event.stopPropagation()
    if (updating) return
    onUpdatePresence(slug)
  }

  return (
    <PresenceContextMenu
      slug={slug}
      name={presence.metadata.name}
      enabled={presence.enabled}
      showSchedule={showSchedule}
      updateAvailable={updateAvailable}
      updating={updating}
      onOpenWebsite={onOpenWebsite}
      onRemove={onRemove}
      onSchedule={onSchedule}
      onSnooze={onSnooze}
      onToggle={onToggle}
      onUpdatePresence={onUpdatePresence}
      render={<article className="relative bg-card transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-secondary" />}
    >
      {updateAvailable ? (
        <div className="flex h-8 items-center gap-2 border-b border-border bg-card px-1.5">
          <Badge
            variant="default"
            className="bg-accent/10 text-accent"
          >
            {t("version", { version: updateAvailable })}
          </Badge>
          <button
            type="button"
            onClick={openUpdate}
            className="min-w-0 flex-1 truncate text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("presence-update-available")}
          </button>
          <Button
            variant="outline"
            size="xs"
            onClick={openUpdate}
            disabled={updating}
          >
            {updating ? <RiLoader2Line className="animate-spin" /> : null}
            {updating ? t("store-installing") : t("presence-update-action")}
          </Button>
        </div>
      ) : null}
      <div className="flex items-center gap-3 px-3 py-3">
        <button
          type="button"
          onClick={() => onOpen(slug)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <PresenceTile
            slug={slug}
            name={presence.metadata.name}
            dimmed={!presence.enabled}
            className="size-10"
          />

          <div className="min-w-0 flex-1">
            <p
              className={
                presence.enabled ? "truncate text-sm font-medium text-foreground" : "truncate text-sm font-medium text-muted-foreground/80"
              }
            >
              {presence.metadata.name}
            </p>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: presence.enabled ? presence.metadata.color : "var(--muted-foreground)" }}
              />
              <span className="truncate">{presence.enabled ? t("enabled") : t("disabled")}</span>
              {presence.metadata.version ? <Badge variant="outline">{t("version", { version: presence.metadata.version })}</Badge> : null}
            </div>
          </div>
        </button>

        <Switch
          checked={presence.enabled}
          onCheckedChange={(checked) => onToggle(slug, checked)}
          aria-label={presence.enabled ? t("disable") : t("enable")}
        />

        {showSchedule ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onSchedule(slug)}
            aria-label={t("schedule")}
          >
            <RiCalendarLine />
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpen(slug)}
          aria-label={t("settings")}
          title={t("settings")}
        >
          <RiSettings3Line />
        </Button>
      </div>
    </PresenceContextMenu>
  )
}
