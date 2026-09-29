import { RiMoonClearLine } from "@remixicon/react"
import { useI18n } from "@/hooks/i18n-provider"
import { usePresenceActions } from "@/hooks/use-presence-actions"
import { formatTime } from "@/lib/format"
import type { StoredPresence } from "@/shared/types"
import { Button } from "@/ui/button"
import { Card } from "@/ui/card"
import { Chip } from "@/ui/chip"
import { Section } from "@/ui/section"
import { useToast } from "@/ui/toast"

const MINUTE_MS = 60_000
const TOMORROW_RESUME_HOUR = 8

const SNOOZE_OPTIONS = [
  { key: "snooze.30m", durationMs: 30 * MINUTE_MS },
  { key: "snooze.1h", durationMs: 60 * MINUTE_MS },
  { key: "snooze.4h", durationMs: 4 * 60 * MINUTE_MS },
] as const

const untilTomorrowMorning = (): number => {
  const next = new Date()
  next.setDate(next.getDate() + 1)
  next.setHours(TOMORROW_RESUME_HOUR, 0, 0, 0)
  return next.getTime() - Date.now()
}

export const PresenceSnoozeSection = ({ slug, name, stored }: { slug: string; name: string; stored: StoredPresence }) => {
  const { t, locale } = useI18n()
  const { toast } = useToast()
  const actions = usePresenceActions()
  const snoozedUntil = stored.snoozeUntil && stored.snoozeUntil > Date.now() ? stored.snoozeUntil : null

  const snooze = (durationMs: number) => void actions.snooze(slug, durationMs).then(() => toast(t("toast.snoozed", { name }), "info"))

  return (
    <Section title={t("detail.takeBreak")}>
      <Card className="flex flex-col gap-3 p-4">
        {snoozedUntil ? (
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-hover text-muted">
              <RiMoonClearLine className="size-[18px]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-label-lg font-medium">{t("status.snoozedUntil", { time: formatTime(snoozedUntil, locale) })}</span>
              <span className="text-label-md text-muted">{t("detail.snoozedHint")}</span>
            </div>
            <Button size="sm" variant="secondary" onClick={() => void actions.clearSnooze(slug)}>
              {t("action.resume")}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-label-md text-muted">{t("detail.snoozeHint")}</p>
            <div className="flex flex-wrap gap-1.5">
              {SNOOZE_OPTIONS.map((option) => (
                <Chip key={option.key} onClick={() => snooze(option.durationMs)}>
                  {t(option.key)}
                </Chip>
              ))}
              <Chip onClick={() => snooze(untilTomorrowMorning())}>{t("snooze.tomorrow")}</Chip>
            </div>
          </>
        )}
      </Card>
    </Section>
  )
}
