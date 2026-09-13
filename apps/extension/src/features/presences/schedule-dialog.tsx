import { Dialog, dialogPrimaryClassName } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { sendMessage } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { ExtensionSettings, InstalledPresences } from "@/shared/types";
import { IconCheck, IconClock, IconLoader2 } from "@/lib/tabler-icons";
import type { FC, ReactElement } from "react";
import { useState } from "react";

type Props = {
  activeSlug: string | null;
  globalSchedule: ExtensionSettings["globalSchedule"];
  onClose: () => void;
  open: boolean;
  presences: InstalledPresences;
};

const dayKeys = ["day-sun", "day-mon", "day-tue", "day-wed", "day-thu", "day-fri", "day-sat"] as const;

export const ScheduleDialog: FC<Props> = ({ activeSlug, globalSchedule, onClose, open, presences }): ReactElement | null => {
  const presence = activeSlug ? presences[activeSlug] : null;
  const currentSchedule = activeSlug ? presence?.schedule : globalSchedule;
  const hasTimeRange = Boolean(currentSchedule?.start && currentSchedule?.end);
  const [scheduleDays, setScheduleDays] = useState<number[]>(currentSchedule?.days ?? []);
  const [useTimeRange, setUseTimeRange] = useState(hasTimeRange);
  const [scheduleStart, setScheduleStart] = useState(currentSchedule?.start ?? "09:00");
  const [scheduleEnd, setScheduleEnd] = useState(currentSchedule?.end ?? "18:00");
  const [saved, setSaved] = useState<"idle" | "saving" | "done">("idle");

  const isGlobal = !activeSlug;

  const toggleDay = (day: number): void => {
    setScheduleDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleSave = (): void => {
    const schedule = scheduleDays.length > 0
      ? { ...(useTimeRange ? { start: scheduleStart, end: scheduleEnd } : {}), days: scheduleDays }
      : undefined;

    setSaved("saving");

    if (isGlobal) {
      void sendMessage("SET_SETTINGS", { globalSchedule: schedule });
    } else {
      void sendMessage("SET_PRESENCE_SCHEDULE", { slug: activeSlug, schedule });
    }

    setTimeout(() => { setSaved("done"); }, 400);
    setTimeout(() => { setSaved("idle"); onClose(); }, 1200);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      subtitle={t("schedule-description")}
      title={t("schedule")}
      footer={(
        <Button variant="unstyled" size="none" onClick={handleSave} className={dialogPrimaryClassName}>
          {saved === "saving" ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : saved === "done" ? (
            <IconCheck className="size-4" />
          ) : (
            t("save")
          )}
        </Button>
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {dayKeys.map((key, day) => (
            <Button
              key={day}
              variant="unstyled"
              size="none"
              onClick={() => toggleDay(day)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                scheduleDays.includes(day)
                  ? "border border-accent bg-accent/10 text-accent"
                  : "border border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground"
              }`}
            >
              {t(key)}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card-2 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <IconClock className="size-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t("schedule-time-range")}</span>
          </div>
          <Switch checked={useTimeRange} onChange={setUseTimeRange} ariaLabel="Toggle time range" />
        </div>

        {useTimeRange ? (
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">{t("start-time")}</span>
              <Input
                unstyled
                type="time"
                value={scheduleStart}
                onChange={(e) => setScheduleStart(e.target.value)}
                className="h-10 rounded-xl border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors focus:border-border-light"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">{t("end-time")}</span>
              <Input
                unstyled
                type="time"
                value={scheduleEnd}
                onChange={(e) => setScheduleEnd(e.target.value)}
                className="h-10 rounded-xl border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors focus:border-border-light"
              />
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
};
