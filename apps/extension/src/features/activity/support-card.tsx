import { RiHeart3Line } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { openUrl, siteUrl } from "@/shared/browser-links"
import { Button } from "@/ui/button"
import { Card } from "@/ui/card"
import { useSupportCard } from "@/features/activity/use-support-card"

export const SupportCard = () => {
  const { t } = useI18n()
  const { visible, snooze } = useSupportCard()

  if (!visible) return null

  const support = () => {
    openUrl(siteUrl("/support#donate"))
    snooze("support")
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-hover text-muted">
          <RiHeart3Line className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-label-lg font-medium">{t("support.cardTitle")}</span>
          <span className="text-label-md text-muted">{t("support.cardDescription")}</span>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => snooze("later")}>
          {t("support.later")}
        </Button>
        <Button size="sm" variant="secondary" onClick={support}>
          {t("support.support")}
        </Button>
      </div>
    </Card>
  )
}
