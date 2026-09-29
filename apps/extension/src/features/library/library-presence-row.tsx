import { PresenceIcon } from "@/components/shared/presence-icon"
import { useI18n } from "@/hooks/i18n-provider"
import { formatCompact, formatDate, hostnameOf } from "@/lib/format"
import { categoryKey } from "@/lib/presence-categories"
import type { PresenceView } from "@/lib/presence-view"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { DotSeparator } from "@/ui/dot-separator"
import { LiveDot } from "@/ui/live-dot"

type LibraryPresenceRowProps = {
  view: PresenceView
  isNew: boolean
  installed: boolean
  installing: boolean
  showPublishedDate: boolean
  onOpen: () => void
  onInstall: () => void
}

export const LibraryPresenceRow = ({ view, isNew, installed, installing, showPublishedDate, onOpen, onInstall }: LibraryPresenceRowProps) => {
  const { t, locale } = useI18n()
  const publishedDate = showPublishedDate ? formatDate(view.addedAt, locale) : null

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-hover">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PresenceIcon slug={view.slug} name={view.name} color={view.color} size={40} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate text-label-lg font-medium">{view.name}</span>
            {isNew && <Badge tone="primary">{t("library.new")}</Badge>}
          </span>
          <span className="truncate text-label-md text-muted">{view.description || hostnameOf(view.urls[0] ?? "")}</span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 overflow-hidden text-label-sm whitespace-nowrap text-muted">
            {(view.activeUsers ?? 0) > 0 && (
              <>
                <LiveDot pulse={false} className="size-1" />
                <span>{t("library.usersNow", { count: formatCompact(view.activeUsers, locale) })}</span>
                <DotSeparator />
              </>
            )}
            <span className="shrink-0">{t(categoryKey(view.category))}</span>
            {publishedDate && (
              <>
                <DotSeparator />
                <span className="min-w-0 truncate">{t("library.publishedOn", { date: publishedDate })}</span>
              </>
            )}
          </span>
        </span>
      </button>
      {installed ? (
        <Button size="sm" variant="solid" onClick={onOpen}>
          {t("library.manage")}
        </Button>
      ) : (
        <Button size="sm" variant="secondary" loading={installing} onClick={onInstall}>
          {t("action.get")}
        </Button>
      )}
    </div>
  )
}
