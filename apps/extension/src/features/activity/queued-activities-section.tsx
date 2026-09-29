import { PresenceIcon } from "@/components/shared/presence-icon"
import { useExtensionState } from "@/hooks/extension-state-provider"
import { useI18n } from "@/hooks/i18n-provider"
import { useNav } from "@/hooks/navigation-provider"
import type { TabActivity } from "@/shared/types"
import { Group } from "@/ui/card"
import { Row } from "@/ui/row"
import { Section } from "@/ui/section"

export const QueuedActivitiesSection = ({ activities }: { activities: TabActivity[] }) => {
  const { state } = useExtensionState()
  const { t } = useI18n()
  const { push } = useNav()

  if (activities.length === 0) return null

  return (
    <Section title={state.settings.activitySelectionMode === "priority" ? t("activity.queuedPriority") : t("activity.queued")}>
      <Group>
        {activities.map((entry) => {
          const stored = state.presences[entry.slug]
          if (!stored) return null
          return (
            <Row
              key={entry.tabId}
              leading={<PresenceIcon slug={entry.slug} name={stored.metadata.name} color={stored.metadata.color} size={32} />}
              title={entry.presence.details ?? stored.metadata.name}
              description={entry.presence.state ?? stored.metadata.name}
              onClick={() => push({ name: "presence", slug: entry.slug })}
              chevron
            />
          )
        })}
      </Group>
    </Section>
  )
}
