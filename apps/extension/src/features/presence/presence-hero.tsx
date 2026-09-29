import { PresenceIcon } from "@/components/shared/presence-icon"
import { PresenceThumbnail } from "@/components/shared/presence-thumbnail"
import { useI18n } from "@/hooks/i18n-provider"
import { categoryKey } from "@/lib/presence-categories"
import type { PresenceView } from "@/lib/presence-view"
import { Badge } from "@/ui/badge"
import { DotSeparator } from "@/ui/dot-separator"
import { AuthorLink } from "@/features/presence/author-link"

export const PresenceHero = ({ view, version }: { view: PresenceView; version?: string | null }) => {
  const { t } = useI18n()
  return (
    <div className="flex flex-col">
      <PresenceThumbnail slug={view.slug} color={view.color} className="aspect-[16/9] w-full rounded-lg" />
      <div className="relative -mt-10 flex items-end gap-1.5 px-3">
        <div className="shrink-0 rounded-[14px] bg-canvas p-1">
          <PresenceIcon slug={view.slug} name={view.name} color={view.color} size={60} rounded="rounded-[10px]" />
        </div>
        <div className="mb-2 min-w-0 rounded-[12px] bg-canvas px-3 py-1.5">
          <h1 className="truncate text-headline-sm font-medium tracking-[-0.3px]">{view.name}</h1>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-label-md text-muted">
        {view.author && (
          <span className="flex items-center gap-1">
            {t("detail.by")}
            <AuthorLink author={view.author} />
          </span>
        )}
        <DotSeparator />
        <span>{t(categoryKey(view.category))}</span>
        {version && (
          <>
            <DotSeparator />
            <span>v{version}</span>
          </>
        )}
        {view.discordNative && <Badge tone="outline">{t("detail.discordNative")}</Badge>}
      </div>
    </div>
  )
}
