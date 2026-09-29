import type { PresenceSchedule } from "@/shared/types"
import { Input } from "@/ui/input"
import { cn } from "@/ui/cn"
import { useI18n } from "@/hooks/i18n-provider"
import { LOCALE_LONG_MAP } from "@/shared/locales"

const ORDER = [1, 2, 3, 4, 5, 6, 0]

export const DEFAULT_SCHEDULE: PresenceSchedule = { days: [1, 2, 3, 4, 5], start: "09:00", end: "18:00" }

export const ScheduleEditor = ({ value, onChange }: { value: PresenceSchedule; onChange: (value: PresenceSchedule) => void }) => {
  const { t, locale } = useI18n()
  const dayName = (day: number) =>
    new Intl.DateTimeFormat(LOCALE_LONG_MAP[locale], { weekday: "narrow" }).format(new Date(2024, 0, 7 + day))
  const dayLong = (day: number) => new Intl.DateTimeFormat(LOCALE_LONG_MAP[locale], { weekday: "long" }).format(new Date(2024, 0, 7 + day))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between gap-1" role="group" aria-label={t("schedule.days")}>
        {ORDER.map((day) => {
          const active = value.days.includes(day)
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              aria-label={dayLong(day)}
              title={dayLong(day)}
              onClick={() =>
                onChange({ ...value, days: active ? value.days.filter((entry) => entry !== day) : [...value.days, day].sort() })
              }
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-label-md font-medium capitalize transition-colors",
                active ? "bg-ink text-canvas" : "border border-line text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {dayName(day)}
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-muted">{t("schedule.from")}</span>
          <Input type="time" value={value.start ?? ""} onChange={(event) => onChange({ ...value, start: event.target.value || undefined })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-muted">{t("schedule.to")}</span>
          <Input type="time" value={value.end ?? ""} onChange={(event) => onChange({ ...value, end: event.target.value || undefined })} />
        </label>
      </div>
    </div>
  )
}
