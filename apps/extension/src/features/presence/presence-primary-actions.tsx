import { RiArrowUpCircleLine } from "@remixicon/react"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n, type Translate } from "@/hooks/i18n-provider"
import { usePresenceActions } from "@/hooks/use-presence-actions"
import { formatTime, hostnameOf } from "@/lib/format"
import { presenceStatus, type PresenceStatus } from "@/lib/presence-status"
import type { PresenceView } from "@/lib/presence-view"
import type { Locale } from "@/shared/locales"
import type { StoredPresence } from "@/shared/types"
import { Button } from "@/ui/button"
import { Group } from "@/ui/card"
import { SwitchRow } from "@/ui/row"

const enabledDescription = (status: PresenceStatus, stored: StoredPresence, view: PresenceView, t: Translate, locale: Locale): string => {
  switch (status.kind) {
    case "live":
      return t("status.live")
    case "snoozed":
      return t("status.snoozedUntil", { time: formatTime(status.until, locale) })
    case "schedule":
      return t("status.schedule")
    case "paused":
      return t("status.paused")
    default:
      return stored.enabled ? t("detail.enabledHint", { host: hostnameOf(view.urls[0] ?? "") }) : t("detail.disabledHint")
  }
}

export const PresencePrimaryActions = ({ view, stored }: { view: PresenceView; stored: StoredPresence | undefined }) => {
  const { state } = useExtensionState()
  const { t, locale } = useI18n()
  const actions = usePresenceActions()
  const update = state.updates[view.slug]

  if (!stored) {
    return (
      <Button loading={actions.pending === view.slug} onClick={() => void actions.install(view.slug, view.name)} className="w-full">
        {t("detail.install")}
      </Button>
    )
  }

  const status = presenceStatus(view.slug, stored, state.settings, {
    liveSlug: state.activity?.slug,
    detectedSlugs: new Set(state.tab.activities.map((entry) => entry.slug)),
  })

  return (
    <div className="flex flex-col gap-2">
      {update && (
        <Button icon={<RiArrowUpCircleLine className="size-4" />} loading={actions.pending === view.slug} onClick={() => void actions.update(view.slug, view.name)}>
          {t("detail.updateTo", { version: update })}
        </Button>
      )}
      <Group>
        <SwitchRow
          title={stored.enabled ? t("detail.enabled") : t("detail.disabled")}
          description={enabledDescription(status, stored, view, t, locale)}
          checked={stored.enabled}
          label={t("detail.enabled")}
          onChange={(checked) => void actions.toggle(view.slug, checked)}
        />
      </Group>
    </div>
  )
}
