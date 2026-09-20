import { RiCheckLine, RiLoader2Line, RiTimeLine } from "@remixicon/react"
import { useState } from "react"
import { sendMessage } from "@/lib/messages"
import { t } from "@/shared/i18n"
import type { ExtensionSettings, InstalledPresences } from "@/shared/types"
import { Button } from "@/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog"
import { Input } from "@/ui/input"
import { Switch } from "@/ui/switch"
import { cn } from "@/ui/utils"

type Props = {
  activeSlug: string | null
  globalSchedule: ExtensionSettings["globalSchedule"]
  onClose: () => void
  open: boolean
  presences: InstalledPresences
}

const dayKeys = ["day-sun", "day-mon", "day-tue", "day-wed", "day-thu", "day-fri", "day-sat"] as const

export const ScheduleDialog = ({ activeSlug, globalSchedule, onClose, open, presences }: Props): React.JSX.Element | null => {
  const presence = activeSlug ? presences[activeSlug] : null
  const currentSchedule = activeSlug ? presence?.schedule : globalSchedule
  const hasTimeRange = Boolean(currentSchedule?.start && currentSchedule?.end)
  const [scheduleDays, setScheduleDays] = useState<number[]>(currentSchedule?.days ?? [])
  const [useTimeRange, setUseTimeRange] = useState(hasTimeRange)
  const [scheduleStart, setScheduleStart] = useState(currentSchedule?.start ?? "09:00")
  const [scheduleEnd, setScheduleEnd] = useState(currentSchedule?.end ?? "18:00")
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle")

  const isGlobal = !activeSlug

  const toggleDay = (day: number): void => {
    setScheduleDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleSave = (): void => {
    const schedule = scheduleDays.length > 0 ? { ...(useTimeRange ? { start: scheduleStart, end: scheduleEnd } : {}), days: scheduleDays } : undefined

    setSaved("saving")

    if (isGlobal) {
      void sendMessage("SET_SETTINGS", { globalSchedule: schedule })
    } else {
      void sendMessage("SET_PRESENCE_SCHEDULE", { slug: activeSlug, schedule })
    }

    setTimeout(() => setSaved("done"), 400)
    setTimeout(() => {
      setSaved("idle")
      onClose()
    }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("schedule")}</DialogTitle>
          <DialogDescription>{t("schedule-description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {dayKeys.map((key, day) => (
              <Button
                key={day}
                variant={scheduleDays.includes(day) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleDay(day)}
                className={cn(scheduleDays.includes(day) && "bg-accent/10 text-accent border-accent hover:brightness-100")}
              >
                {t(key)}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary px-3 py-2.5">
            <label htmlFor="schedule-time-range-toggle" className="flex cursor-pointer items-center gap-2">
              <RiTimeLine className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{t("schedule-time-range")}</span>
            </label>
            <Switch id="schedule-time-range-toggle" checked={useTimeRange} onCheckedChange={setUseTimeRange} />
          </div>

          {useTimeRange ? (
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">{t("start-time")}</span>
                <Input type="time" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">{t("end-time")}</span>
                <Input type="time" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} />
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saved !== "idle"}>
            {saved === "saving" ? <RiLoader2Line className="animate-spin" /> : saved === "done" ? <RiCheckLine /> : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
