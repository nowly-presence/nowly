import { RiDiscLine, RiSnowflakeLine, RiSunLine } from "@remixicon/react"
import { useEffect, useState } from "react"
import { PresenceTile } from "@/components/shared/presence-tile"
import { IdlePulse } from "@/features/activity/idle-pulse"
import { getActivitySubtitle, getActivityTitle } from "@/lib/format"
import { t } from "@/shared/i18n"
import type { CurrentActivity, InstalledPresences } from "@/shared/types"
import { Button } from "@/ui/button"
import { Skeleton } from "@/ui/skeleton"

type Props = {
  activity: CurrentActivity | null
  idleHint?: string
  isLoading: boolean
  isPaused?: boolean
  isSnoozed: boolean
  onSnooze: () => void
  onUnsnooze: () => void
  presences: InstalledPresences
}

type MediaCategory = "music" | "streaming" | "video" | "other"

const hasProgress = (category?: MediaCategory) => category && category !== "other"

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = String(safeSeconds % 60).padStart(2, "0")
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${remainingSeconds}`
  return `${minutes}:${remainingSeconds}`
}

const useRealtimeProgress = (startTime: number | undefined, endTime: number | undefined): { elapsed: string; duration: string; percent: number } | null => {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    if (!startTime || !endTime) return
    const tick = () => setNow(Math.floor(Date.now() / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startTime, endTime])

  if (!startTime || !endTime || endTime <= startTime) return null

  const duration = endTime - startTime
  const elapsed = Math.min(Math.max(now - startTime, 0), duration)

  return { duration: formatTime(duration), elapsed: formatTime(elapsed), percent: Math.min(100, Math.max(0, (elapsed / duration) * 100)) }
}

const useCountdown = (targetTimestamp: number | undefined): string | null => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!targetTimestamp || targetTimestamp <= Date.now()) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetTimestamp])

  if (!targetTimestamp || targetTimestamp <= now) return null
  return formatTime(Math.ceil((targetTimestamp - now) / 1000))
}

export const CurrentActivityCard = ({ activity, idleHint, isLoading, isPaused = false, isSnoozed, onSnooze, onUnsnooze, presences }: Props): React.JSX.Element => {
  const presence = activity ? presences[activity.slug] : null
  const snoozeUntil = activity ? presence?.snoozeUntil : undefined
  const progress = useRealtimeProgress(activity?.presence.startTime, activity?.presence.endTime)
  const snoozeRemaining = useCountdown(snoozeUntil)

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      </section>
    )
  }

  const hasActivity = Boolean(activity)
  const largeImage = activity?.presence.largeImage
  const hasLargeImage = Boolean(largeImage)
  const category = presence?.metadata.category as MediaCategory | undefined
  const title = getActivityTitle(activity, t("nothing-playing"))
  const subtitle = getActivitySubtitle(activity, presence?.metadata.name ?? "")
  const showProgressBar = Boolean(hasProgress(category) && progress)

  if (!hasActivity) {
    return (
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3 p-4">
          <IdlePulse size={56} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            {idleHint ? <p className="mt-1 text-xs leading-4 text-muted-foreground">{idleHint}</p> : null}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card">
      {hasLargeImage ? (
        <>
          <div className="absolute -inset-x-8 -inset-y-6 bg-cover bg-center opacity-40 blur-2xl saturate-50" style={{ backgroundImage: `url("${largeImage}")` }} />
          <div className="absolute inset-0 bg-linear-to-r from-card/70 via-card/85 to-card/70" />
        </>
      ) : null}
      <div className="relative z-1 flex items-center gap-3 p-4">
        {hasLargeImage ? (
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border shadow-md">
            <img src={largeImage} alt="" className="size-full object-cover" />
          </div>
        ) : presence ? (
          <PresenceTile slug={presence.metadata.slug} name={presence.metadata.name} className="size-14" />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
            <RiDiscLine className="size-6 text-muted-foreground" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
          {isPaused ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-warning">{t("presence-paused")}</span>
          ) : isSnoozed && snoozeRemaining ? (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <RiSnowflakeLine className="size-3" />
              {t("snoozed")}
              <span>{snoozeRemaining}</span>
            </span>
          ) : null}
        </div>

        <Button variant="ghost" size="icon-sm" aria-label={isSnoozed ? t("clear-snooze") : t("snooze")} onClick={isSnoozed ? onUnsnooze : onSnooze}>
          {isSnoozed ? <RiSunLine /> : <RiSnowflakeLine />}
        </Button>
      </div>

      {showProgressBar && progress ? (
        <div className="relative z-1 px-4 pb-4">
          <div className="h-1 overflow-hidden rounded-full bg-accent/15">
            <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.elapsed}</span>
            <span>{progress.duration}</span>
          </div>
        </div>
      ) : null}
    </section>
  )
}
