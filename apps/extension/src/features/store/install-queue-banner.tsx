import { t } from "@/shared/i18n"
import { Button } from "@/ui/button"

type Props = {
  count: number
  onRetry: () => void
}

export const InstallQueueBanner = ({ count, onRetry }: Props): React.JSX.Element | null => {
  if (count <= 0) return null
  return (
    <section className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
      <p className="min-w-0 flex-1 text-xs leading-4 text-foreground">{t("install-queue-banner", { count: String(count) })}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        {t("install-queue-retry")}
      </Button>
    </section>
  )
}
