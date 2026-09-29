import { useI18n } from "@/hooks/i18n-provider"
import { formatCompact } from "@/lib/format"
import { Card } from "@/ui/card"

export const PresenceStats = ({ activeUsers, totalInstalls, likes }: { activeUsers: number; totalInstalls: number; likes: number }) => {
  const { t, locale } = useI18n()
  const stats = [
    { label: t("detail.activeNow"), value: activeUsers },
    { label: t("detail.installs"), value: totalInstalls },
    { label: t("detail.likes"), value: likes },
  ]
  return (
    <Card className="grid grid-cols-3 divide-x divide-line">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center gap-0.5 px-2 py-3">
          <span className="text-body-md font-medium tabular-nums">{formatCompact(stat.value, locale)}</span>
          <span className="text-label-sm text-muted">{stat.label}</span>
        </div>
      ))}
    </Card>
  )
}
