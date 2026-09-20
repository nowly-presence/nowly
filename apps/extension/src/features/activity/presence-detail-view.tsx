import { RiCalendarLine, RiDeleteBinLine, RiExternalLinkLine, RiLoader2Line } from "@remixicon/react"
import { useEffect, type MouseEvent } from "react"
import { BackButton } from "@/components/shared/back-button"
import { PresenceTile } from "@/components/shared/presence-tile"
import { DiscordNativeNotice } from "@/features/activity/discord-native-notice"
import { getCategoryLabel } from "@/features/activity/presence-list.model"
import { PresenceAboutCard } from "@/features/activity/presence-detail-info"
import { PresenceHeroCard } from "@/features/activity/presence-hero-card"
import { PresenceSettingsFields } from "@/features/activity/presence-settings-fields"
import { PresenceSettingsPreview } from "@/features/activity/presence-settings-preview"
import { resolveLocaleList, resolveLocaleString } from "@/features/activity/presence-locale"
import { t } from "@/shared/i18n"
import type { StoredPresence } from "@/shared/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/alert-dialog"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"
import { Switch } from "@/ui/switch"

export type PresenceDetailData = {
  author?: { github?: string; name: string }
  category: string
  color: string
  contributors?: Array<{ github?: string; name: string }>
  description: string
  discordNative: boolean
  features: string[]
  longDescription?: string
  name: string
  slug: string
  settings?: Record<string, unknown>
  urls: string[]
  version?: string | null
}

type CommonProps = {
  data: PresenceDetailData
  onBack: () => void
  onOpenWebsite?: (slug: string) => void
}

type InstalledProps = CommonProps & {
  mode: "installed"
  onRemove: (slug: string) => void
  onSchedule?: (slug: string) => void
  onToggle: (slug: string, enabled: boolean) => void
  onUpdatePresence: (slug: string) => void
  presence: StoredPresence
  updateAvailable?: string
  updating?: boolean
}

type CatalogProps = CommonProps & {
  installing: boolean
  mode: "catalog"
  onInstall: (slug: string) => void
  installLabel: string
}

type Props = InstalledProps | CatalogProps

const installedActionsClassName =
  "flex w-full items-center gap-3 rounded-lg bg-secondary/50 px-3 py-3 text-left text-sm text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
const uninstallActionClassName =
  "flex w-full items-center gap-2 rounded-lg bg-secondary/50 px-3 py-3 text-left text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/50"

export const PresenceDetailView = (props: Props): React.JSX.Element => {
  const { data, onBack, onOpenWebsite } = props
  const description = data.longDescription ?? data.description

  useEffect(() => {
    document.getElementById("sidepanel-tabpanel")?.scrollTo(0, 0)
  }, [data.slug])

  const openUpdate = (event: MouseEvent): void => {
    if (props.mode !== "installed") return
    event.stopPropagation()
    if (props.updating) return
    props.onUpdatePresence(data.slug)
  }

  return (
    <div className="flex flex-col gap-3">
      <BackButton
        onClick={onBack}
        label={t("back")}
      />

      <PresenceHeroCard
        key={data.slug}
        slug={data.slug}
        color={data.color}
        footer={
          props.mode === "installed" && props.updateAvailable ? (
            <button
              type="button"
              onClick={openUpdate}
              disabled={props.updating}
              className="relative z-10 flex w-full items-center gap-2 border-t border-accent/20 bg-accent/10 px-4 py-2 text-left text-xs font-medium text-accent disabled:opacity-60"
            >
              <span className="min-w-0 flex-1">{t("presence-update-available")}</span>
              <span className="inline-flex shrink-0 items-center gap-1">
                {props.updating ? <RiLoader2Line className="size-3.5 animate-spin" /> : null}
                {props.updating ? t("store-installing") : t("presence-update-action")}
              </span>
            </button>
          ) : null
        }
      >
        <div className="flex items-start gap-3">
          <PresenceTile
            slug={data.slug}
            name={data.name}
            dimmed={props.mode === "installed" && !props.presence.enabled}
            className="size-12"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{data.name}</h1>
              {data.version ? <Badge variant="outline">{t("version", { version: data.version })}</Badge> : null}
            </div>
            {data.category ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{data.category}</p> : null}
            {description ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {props.mode === "installed" ? (
            <Switch
              checked={props.presence.enabled}
              onCheckedChange={(checked) => props.onToggle(data.slug, checked)}
              aria-label={props.presence.enabled ? t("disable") : t("enable")}
            />
          ) : null}
        </div>
      </PresenceHeroCard>

      {data.discordNative ? <DiscordNativeNotice name={data.name} /> : null}
      <PresenceAboutCard
        author={data.author}
        contributors={data.contributors}
        features={data.features}
        urls={data.urls}
      />

      {props.mode === "catalog" ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <h2 className="px-4 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("settings")}</h2>
          <PresenceSettingsPreview definitions={data.settings} />
          <div className="grid grid-cols-2 gap-1 border-t border-border px-1 py-1">
            {onOpenWebsite ? (
              <button
                type="button"
                onClick={() => onOpenWebsite(data.slug)}
                className="flex w-full items-center gap-2 rounded-lg bg-secondary/50 px-3 py-3 text-left text-sm text-foreground outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <RiExternalLinkLine className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">{t("presence-open-site")}</span>
              </button>
            ) : null}
            <Button
              variant="default"
              disabled={props.installing}
              onClick={() => props.onInstall(data.slug)}
              className="h-auto min-h-11 justify-start px-3 py-3 font-normal"
            >
              {props.installing ? <RiLoader2Line className="animate-spin" /> : null}
              <span className="min-w-0 flex-1 text-left">{props.installing ? t("store-installing") : props.installLabel}</span>
            </Button>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <h2 className="px-4 pt-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("settings")}</h2>
          <div className="divide-y divide-border">
            <PresenceSettingsFields
              definitions={(props.presence.metadata.settings ?? {}) as Record<string, unknown>}
              locales={props.presence.metadata.locales}
              slug={data.slug}
            />
          </div>
          <div className="flex flex-col gap-1 border-t border-border px-1 py-1">
            {props.onSchedule ? (
              <button
                type="button"
                onClick={() => props.onSchedule?.(data.slug)}
                className={installedActionsClassName}
              >
                <RiCalendarLine className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">{t("schedule")}</span>
              </button>
            ) : null}
            <div className="grid grid-cols-2 gap-1">
              {onOpenWebsite ? (
                <button
                  type="button"
                  onClick={() => onOpenWebsite(data.slug)}
                  className={installedActionsClassName}
                >
                  <RiExternalLinkLine className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">{t("presence-open-site")}</span>
                </button>
              ) : null}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <button
                      type="button"
                      className={uninstallActionClassName}
                    />
                  }
                >
                  <RiDeleteBinLine className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1">{t("uninstall")}</span>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("uninstall")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("uninstall-confirm", { name: data.name })}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => props.onRemove(data.slug)}
                      className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                    >
                      <RiDeleteBinLine />
                      {t("uninstall")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export const installedPresenceDetailData = (slug: string, presence: StoredPresence): PresenceDetailData => ({
  author: presence.metadata.author,
  category: getCategoryLabel(presence.metadata.category),
  color: presence.metadata.color,
  contributors: presence.metadata.contributors,
  description: resolveLocaleString(presence.metadata.description) ?? "",
  discordNative: presence.metadata.discordNative === true,
  features: resolveLocaleList(presence.metadata.features),
  name: presence.metadata.name,
  slug,
  settings: presence.metadata.settings,
  urls: [...new Set(presence.metadata.url ?? [])],
  version: presence.metadata.version,
})
