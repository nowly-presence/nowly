import { RiSubtractLine, RiAddLine } from "@remixicon/react"
import { useState } from "react"
import { sendMessage } from "@/lib/messages"
import { t } from "@/shared/i18n"
import type { InstalledPresences } from "@/shared/types"
import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"

const STEP_MINUTES = 5
const MIN_MINUTES = 5
const MAX_MINUTES = 240

type Props = {
  activeSlug: string | null
  onClose: () => void
  open: boolean
  presences: InstalledPresences
}

const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h${m}` : `${h}h`
  }
  return `${minutes}min`
}

export const SnoozeDialog = ({ activeSlug, onClose, open, presences }: Props): React.JSX.Element | null => {
  const presence = activeSlug ? presences[activeSlug] : null
  const isSnoozed = Boolean(presence?.snoozeUntil && presence.snoozeUntil > Date.now())
  const [duration, setDuration] = useState(15)

  const dec = (): void => setDuration((d) => Math.max(MIN_MINUTES, d - STEP_MINUTES))
  const inc = (): void => setDuration((d) => Math.min(MAX_MINUTES, d + STEP_MINUTES))

  const handleSnooze = (): void => {
    if (!activeSlug) return
    void sendMessage("SNOOZE_PRESENCE", { slug: activeSlug, duration: duration * 60 * 1000 })
    onClose()
  }

  const handleSnoozeUntilMidnight = (): void => {
    if (!activeSlug) return
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    const untilMidnight = Math.max(60 * 1000, midnight.getTime() - now.getTime())
    void sendMessage("SNOOZE_PRESENCE", { slug: activeSlug, duration: untilMidnight })
    onClose()
  }

  const handleClearSnooze = (): void => {
    if (!activeSlug) return
    void sendMessage("CLEAR_SNOOZE", { slug: activeSlug })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("snooze")}</DialogTitle>
          <DialogDescription>{t("snooze-description")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-2">
          <Button
            variant="outline"
            size="icon"
            onClick={dec}
            aria-label={t("snooze-decrease-duration")}
          >
            <RiSubtractLine />
          </Button>
          <span className="min-w-18 text-center text-base font-semibold tabular-nums text-foreground">{formatDuration(duration)}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={inc}
            aria-label={t("snooze-increase-duration")}
          >
            <RiAddLine />
          </Button>
        </div>

        <DialogFooter>
          {isSnoozed ? (
            <Button
              variant="outline"
              onClick={handleClearSnooze}
            >
              {t("clear-snooze")}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={handleSnoozeUntilMidnight}
          >
            {t("snooze-until-midnight")}
          </Button>
          <Button onClick={handleSnooze}>{t("snooze")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
