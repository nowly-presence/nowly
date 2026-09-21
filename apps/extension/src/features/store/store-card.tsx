import { RiDownloadLine, RiExternalLinkLine, RiLoader2Line } from "@remixicon/react"
import type { MouseEvent } from "react"
import { PresenceTile } from "@/components/shared/presence-tile"
import { storeCategoryLabel, type StorePresence } from "@/features/store/store.model"
import { t } from "@/shared/i18n"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/ui/context-menu"

type StoreAction = "install" | "update" | "installed"

type Props = {
  action: StoreAction
  installing: boolean
  onInstall: (slug: string) => void
  onOpen: (slug: string) => void
  onOpenWebsite: (slug: string) => void
  presence: StorePresence
}

export const StoreCard = ({ action, installing, onInstall, onOpen, onOpenWebsite, presence }: Props): React.JSX.Element => {
  const onAction = (event: MouseEvent): void => {
    event.stopPropagation()
    if (action === "installed" || installing) return
    onInstall(presence.slug)
  }

  const label = action === "installed" ? t("store-installed") : action === "update" ? t("store-update") : t("store-install")

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<article className="relative bg-card transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-secondary" />}>
        <div className="flex items-center gap-3 px-3 py-3">
          <button
            type="button"
            onClick={() => onOpen(presence.slug)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <PresenceTile
              slug={presence.slug}
              name={presence.name}
              className="size-10"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{presence.name}</p>
              <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate">{storeCategoryLabel(presence.category)}</span>
                {presence.version ? <Badge variant="outline">{t("version", { version: presence.version })}</Badge> : null}
              </p>
            </div>
          </button>
          <Button
            variant={action === "installed" ? "secondary" : "default"}
            size="sm"
            disabled={action === "installed" || installing}
            onClick={onAction}
            className="font-normal"
          >
            {installing ? <RiLoader2Line className="animate-spin" /> : null}
            {installing ? t("store-installing") : label}
          </Button>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {action !== "installed" ? (
          <ContextMenuItem onClick={() => onInstall(presence.slug)}>
            <RiDownloadLine />
            <span>{action === "update" ? t("store-update") : t("store-install")}</span>
          </ContextMenuItem>
        ) : null}
        <ContextMenuItem onClick={() => onOpenWebsite(presence.slug)}>
          <RiExternalLinkLine />
          <span>{t("presence-open-site")}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
