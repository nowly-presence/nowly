import { RiLoader2Line } from "@remixicon/react"
import { BackButton } from "@/components/shared/back-button"
import { PresenceTile } from "@/components/shared/presence-tile"
import { DiscordNativeNotice } from "@/features/activity/discord-native-notice"
import { PresenceAboutCard } from "@/features/activity/presence-detail-info"
import { PresenceHeroCard } from "@/features/activity/presence-hero-card"
import { storeCategoryLabel, type StorePresence } from "@/features/store/store.model"
import { t } from "@/shared/i18n"
import { Badge } from "@/ui/badge"
import { Button } from "@/ui/button"

type StoreAction = "install" | "update" | "installed"

type Props = {
  action: StoreAction
  installing: boolean
  onBack: () => void
  onInstall: (slug: string) => void
  presence: StorePresence
}

export const StoreDetail = ({ action, installing, onBack, onInstall, presence }: Props): React.JSX.Element => {
  const category = storeCategoryLabel(presence.category)
  const label = action === "installed" ? t("store-installed") : action === "update" ? t("store-update") : t("store-install")

  return (
    <div className="flex flex-col gap-3">
      <BackButton onClick={onBack} label={t("back")} />

      <PresenceHeroCard key={presence.slug} slug={presence.slug} color={presence.color}>
        <div className="flex items-start gap-3">
          <PresenceTile slug={presence.slug} name={presence.name} className="size-12" />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-base font-semibold text-foreground">{presence.name}</h1>
              {presence.version ? <Badge variant="outline">{t("version", { version: presence.version })}</Badge> : null}
            </div>
            {category ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{category}</p> : null}
            {presence.longDescription ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{presence.longDescription}</p> : null}
          </div>
        </div>
      </PresenceHeroCard>

      {presence.discordNative ? <DiscordNativeNotice name={presence.name} /> : null}

      <PresenceAboutCard features={presence.features} urls={presence.urls} />

      <Button variant={action === "installed" ? "secondary" : "default"} disabled={action === "installed" || installing} onClick={() => onInstall(presence.slug)}>
        {installing ? <RiLoader2Line className="animate-spin" /> : null}
        {installing ? t("store-installing") : label}
      </Button>
    </div>
  )
}
