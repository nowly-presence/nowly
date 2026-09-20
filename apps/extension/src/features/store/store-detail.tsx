import { PresenceDetailView } from "@/features/activity/presence-detail-view"
import { storeCategoryLabel, type StorePresence } from "@/features/store/store.model"
import { t } from "@/shared/i18n"

type StoreAction = "install" | "update" | "installed"

type Props = {
  action: StoreAction
  installing: boolean
  onBack: () => void
  onInstall: (slug: string) => void
  onOpenWebsite: (slug: string) => void
  presence: StorePresence
}

export const StoreDetail = ({ action, installing, onBack, onInstall, onOpenWebsite, presence }: Props): React.JSX.Element => (
  <PresenceDetailView
    data={{
      author: presence.author,
      category: storeCategoryLabel(presence.category),
      color: presence.color,
      contributors: presence.contributors,
      description: presence.description,
      discordNative: presence.discordNative,
      features: presence.features,
      longDescription: presence.longDescription,
      name: presence.name,
      settings: presence.settings,
      slug: presence.slug,
      urls: presence.urls,
      version: presence.version,
    }}
    mode="catalog"
    installing={installing}
    installLabel={action === "installed" ? t("store-installed") : action === "update" ? t("store-update") : t("store-install")}
    onBack={onBack}
    onInstall={onInstall}
    onOpenWebsite={onOpenWebsite}
  />
)
