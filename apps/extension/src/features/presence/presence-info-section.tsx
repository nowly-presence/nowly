import { RiExternalLinkLine } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { formatDate, hostnameOf } from "@/lib/format"
import type { PresenceView } from "@/lib/presence-view"
import { openUrl } from "@/shared/browser-links"
import { wasUpdatedAfterPublication } from "@/shared/presence-dates"
import type { StoredPresence } from "@/shared/types"
import { Group } from "@/ui/card"
import { Chip } from "@/ui/chip"
import { Row } from "@/ui/row"
import { Section } from "@/ui/section"
import { AuthorLink } from "@/features/presence/author-link"

export const PresenceInfoSection = ({ view, stored }: { view: PresenceView; stored: StoredPresence | undefined }) => {
  const { t, locale } = useI18n()
  const hosts = [...new Set(view.urls.map(hostnameOf))]
  const version = stored?.release?.version ?? view.version
  const published = formatDate(view.addedAt, locale)
  const lastUpdated = wasUpdatedAfterPublication(view) ? formatDate(view.lastUpdated, locale) : null

  return (
    <Section title={t("detail.information")}>
      <Group>
        {hosts.length > 0 && (
          <div className="flex flex-col gap-2 px-4 py-3">
            <span className="text-label-md text-muted">{t("detail.worksOn")}</span>
            <div className="flex flex-wrap gap-1.5">
              {hosts.map((host) => (
                <Chip key={host} onClick={() => openUrl(`https://${host}`)} icon={<RiExternalLinkLine className="size-3 text-muted" />}>
                  {host}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {view.author && <Row title={t("detail.author")} trailing={<AuthorLink author={view.author} variant="row" />} />}
        {view.contributors.length > 0 && (
          <Row title={t("detail.contributors")} trailing={<span className="max-w-44 truncate text-label-md">{view.contributors.map((contributor) => contributor.name).join(", ")}</span>} />
        )}
        {version && <Row title={t("detail.version")} trailing={<span className="text-label-md tabular-nums">{version}</span>} />}
        {published && <Row title={t("detail.published")} trailing={<span className="text-label-md">{published}</span>} />}
        {lastUpdated && <Row title={t("detail.updated")} trailing={<span className="text-label-md">{lastUpdated}</span>} />}
        {stored && <Row title={t("detail.installedOn")} trailing={<span className="text-label-md">{formatDate(stored.installedAt, locale)}</span>} />}
      </Group>
    </Section>
  )
}
