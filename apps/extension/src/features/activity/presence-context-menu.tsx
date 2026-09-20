import { RiCalendarLine, RiDeleteBinLine, RiExternalLinkLine, RiRefreshLine, RiSnowflakeLine, RiToggleLine } from "@remixicon/react"
import { useState, type ReactElement, type ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/ui/context-menu"
import { t } from "@/shared/i18n"

type Props = {
  children: ReactNode
  enabled: boolean
  name: string
  onOpenWebsite: (slug: string) => void
  onRemove: (slug: string) => void
  onSchedule: (slug: string) => void
  onSnooze: (slug: string) => void
  onToggle: (slug: string, enabled: boolean) => void
  onUpdatePresence: (slug: string) => void
  render: ReactElement
  showSchedule: boolean
  slug: string
  updateAvailable?: string
  updating?: boolean
}

export const PresenceContextMenu = ({
  children,
  enabled,
  name,
  onOpenWebsite,
  onRemove,
  onSchedule,
  onSnooze,
  onToggle,
  onUpdatePresence,
  render,
  showSchedule,
  slug,
  updateAvailable,
  updating = false,
}: Props): React.JSX.Element => {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger render={render}>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onToggle(slug, !enabled)}>
            <RiToggleLine />
            <span>{enabled ? t("disable") : t("enable")}</span>
          </ContextMenuItem>
          {showSchedule ? (
            <ContextMenuItem onClick={() => onSchedule(slug)}>
              <RiCalendarLine />
              <span>{t("schedule")}</span>
            </ContextMenuItem>
          ) : null}
          <ContextMenuItem onClick={() => onSnooze(slug)}>
            <RiSnowflakeLine />
            <span>{t("snooze")}</span>
          </ContextMenuItem>
          {updateAvailable && !updating ? (
            <ContextMenuItem onClick={() => onUpdatePresence(slug)}>
              <RiRefreshLine />
              <span>{t("presence-update-action")}</span>
            </ContextMenuItem>
          ) : null}
          <ContextMenuItem onClick={() => onOpenWebsite(slug)}>
            <RiExternalLinkLine />
            <span>{t("presence-open-site")}</span>
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <RiDeleteBinLine />
            <span>{t("uninstall")}</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("uninstall")}</AlertDialogTitle>
            <AlertDialogDescription>{t("uninstall-confirm", { name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onRemove(slug)}
              className="bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <RiDeleteBinLine />
              {t("uninstall")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
