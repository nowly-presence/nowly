import { RiArrowLeftSLine, RiCalendarLine, RiExternalLinkLine, RiLoader2Line, RiDeleteBinLine } from "@remixicon/react"
import { useEffect, useState, type MouseEvent } from "react"
import { PresenceTile } from "@/components/shared/presence-tile"
import { DiscordNativeNotice } from "@/features/activity/discord-native-notice"
import { getCategoryLabel } from "@/features/activity/presence-list.model"
import { resolveLocaleList, resolveLocaleString } from "@/features/activity/presence-locale"
import { PresenceAboutCard } from "@/features/activity/presence-detail-info"
import { PresenceCreditsCard } from "@/features/activity/presence-credits-card"
import { PresenceHeroCard } from "@/features/activity/presence-hero-card"
import { PresenceSettingsFields } from "@/features/activity/presence-settings-fields"
import { t } from "@/shared/i18n"
import type { StoredPresence } from "@/shared/types"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/ui/alert-dialog"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Switch } from "@/ui/switch"

type Props = {
  onBack: () => void
  onOpenWebsite: (slug: string) => void
  onRemove: (slug: string) => void
  onSchedule?: (slug: string) => void
  onToggle: (slug: string, enabled: boolean) => void
  onUpdatePresence: (slug: string) => void
  presence: StoredPresence
  slug: string
  updateAvailable?: string
  updating?: boolean
}

const actionRowClassName = "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-muted/50"

export const PresenceDetailView = ({ onBack, onOpenWebsite, onRemove, onSchedule, onToggle, onUpdatePresence, presence, slug, updateAvailable, updating = false }: Props): React.JSX.Element => {
  const description = resolveLocaleString(presence.metadata.description)
  const features = resolveLocaleList(presence.metadata.features)
  const urls = [...new Set(presence.metadata.url ?? [])]
  const category = getCategoryLabel(presence.metadata.category)

  useEffect(() => {
    document.getElementById("sidepanel-tabpanel")?.scrollTo(0, 0)
  }, [slug])

  const openUpdate = (event: MouseEvent): void => {
    event.stopPropagation()
    if (updating) return
    onUpdatePresence(slug)
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-1 w-fit">
        <RiArrowLeftSLine />
        {t("back")}
      </Button>

      <PresenceHeroCard
        key={slug}
        slug={slug}
        color={presence.metadata.color}
        footer={
          updateAvailable ? (
            <button type="button" onClick={openUpdate} disabled={updating} className="relative z-10 flex w-full items-center gap-2 border-t border-accent/20 bg-accent/10 px-4 py-2 text-left text-xs font-medium text-accent disabled:opacity-60">
              <span className="min-w-0 flex-1">{t("presence-update-available")}</span>
              <span className="inline-flex shrink-0 items-center gap-1">
                {updating ? <RiLoader2Line className="size-3.5 animate-spin" /> : null}
                {updating ? t("store-installing") : t("presence-update-action")}
              </span>
            </button>
          ) : null
        }
      >
        <div className="flex items-start gap-3">
          <PresenceTile slug={slug} name={presence.metadata.name} dimmed={!presence.enabled} className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{presence.metadata.name}</h1>
              {presence.metadata.version ? <Badge variant="outline">{t("version", { version: presence.metadata.version })}</Badge> : null}
            </div>
            {category ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{category}</p> : null}
            {description ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          <Switch checked={presence.enabled} onCheckedChange={(checked) => onToggle(slug, checked)} aria-label={presence.enabled ? t("disable") : t("enable")} />
        </div>
      </PresenceHeroCard>

      {presence.metadata.discordNative ? <DiscordNativeNotice name={presence.metadata.name} /> : null}

      <PresenceAboutCard features={features} urls={urls} />
      <PresenceCreditsCard author={presence.metadata.author} contributors={presence.metadata.contributors} />

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="px-4 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("settings")}</h2>
        <div className="divide-y divide-border border-t border-border">
          <PresenceSettingsFields definitions={(presence.metadata.settings ?? {}) as Record<string, unknown>} locales={presence.metadata.locales} slug={slug} />
          {onSchedule ? (
            <button type="button" onClick={() => onSchedule(slug)} className={actionRowClassName}>
              <RiCalendarLine className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">{t("schedule")}</span>
            </button>
          ) : null}
          <button type="button" onClick={() => onOpenWebsite(slug)} className={actionRowClassName}>
            <RiExternalLinkLine className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1">{t("presence-open-site")}</span>
          </button>
        </div>
      </section>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          <RiDeleteBinLine />
          {t("uninstall")}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("uninstall")}</AlertDialogTitle>
            <AlertDialogDescription>{t("uninstall-confirm", { name: presence.metadata.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onRemove(slug)} className="bg-destructive/10 text-destructive hover:bg-destructive/20">
              <RiDeleteBinLine />
              {t("uninstall")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
