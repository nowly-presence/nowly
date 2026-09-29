import { useMemo, type MouseEvent } from "react"
import { PresenceIcon } from "@/components/shared/presence-icon"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import { usePresenceActions } from "@/hooks/use-presence-actions"
import { fromCatalog } from "@/lib/presence-view"
import { urlMatchesPresence } from "@/shared/url-patterns"
import { Button } from "@/ui/button"
import { Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { Section } from "@/ui/section"
import { Switch } from "@/ui/switch"
import { useTabSharing } from "@/features/activity/use-tab-sharing"

const stop = (event: MouseEvent) => event.stopPropagation()

export const CurrentTabSection = () => {
  const { state } = useExtensionState()
  const { t, locale } = useI18n()
  const { push } = useNav()
  const actions = usePresenceActions()
  const setTabMuted = useTabSharing()
  const { tab, presences, catalog, settings } = state
  const installedSlug = tab.installedSlug
  const tabPresence = installedSlug ? presences[installedSlug] : undefined

  const suggestion = useMemo(() => {
    if (!tab.hostname || installedSlug || settings.suggestPresences === false) return undefined
    const match = catalog.items.find((item) => urlMatchesPresence(`https://${tab.hostname}/`, item.url))
    return match ? fromCatalog(match, locale) : undefined
  }, [tab.hostname, installedSlug, settings.suggestPresences, catalog.items, locale])

  const host = tab.hostname
  const tabId = tab.tabId
  if (!host || (!tabPresence && !suggestion)) return null

  const presenceDescription = () => {
    if (!tabPresence?.enabled) return t("status.off")
    if (settings.presencePaused) return t("status.paused")
    return tab.muted ? t("activity.tabHidden", { host }) : t("activity.tabShared", { host })
  }

  return (
    <Section title={t("activity.thisTab")}>
      <Group>
        {tabPresence && installedSlug ? (
          <Row
            leading={<PresenceIcon slug={installedSlug} name={tabPresence.metadata.name} color={tabPresence.metadata.color} size={32} />}
            title={tabPresence.metadata.name}
            description={presenceDescription()}
            onClick={() => push({ name: "presence", slug: installedSlug })}
            trailing={
              tabPresence.enabled ? (
                tabId != null && <Switch checked={!tab.muted} label={t("activity.shareThisTab")} onChange={(checked) => void setTabMuted(tabId, !checked)} />
              ) : (
                <Button size="sm" variant="secondary" onClick={(event) => (stop(event), void actions.toggle(installedSlug, true))}>
                  {t("action.enable")}
                </Button>
              )
            }
          />
        ) : (
          suggestion && (
            <Row
              leading={<PresenceIcon slug={suggestion.slug} name={suggestion.name} color={suggestion.color} size={32} />}
              title={t("activity.supported", { host })}
              description={t("activity.supportedHint", { name: suggestion.name })}
              onClick={() => push({ name: "presence", slug: suggestion.slug })}
              trailing={
                <Button size="sm" loading={actions.pending === suggestion.slug} onClick={(event) => (stop(event), void actions.install(suggestion.slug, suggestion.name))}>
                  {t("action.install")}
                </Button>
              }
            />
          )
        )}
      </Group>
    </Section>
  )
}
