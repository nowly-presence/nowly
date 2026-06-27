import { Sheet } from "@/components/shared/sheet";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { InstalledPresences } from "@/shared/types";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useState } from "react";

const STEP_MINUTES = 5;
const MIN_MINUTES = 5;
const MAX_MINUTES = 240;

type Props = {
  activeSlug: string | null;
  onClose: () => void;
  open: boolean;
  presences: InstalledPresences;
};

const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  }
  return `${minutes}min`;
};

export const SnoozeSheet: FC<Props> = ({ activeSlug, onClose, open, presences }): ReactElement | null => {
  const presence = activeSlug ? presences[activeSlug] : null;
  const isSnoozed = Boolean(presence?.snoozeUntil && presence.snoozeUntil > Date.now());
  const [duration, setDuration] = useState(15);

  const dec = (): void => setDuration((d) => Math.max(MIN_MINUTES, d - STEP_MINUTES));
  const inc = (): void => setDuration((d) => Math.min(MAX_MINUTES, d + STEP_MINUTES));

  const handleSnooze = (): void => {
    if (!activeSlug) return;
    void sendMessage("SNOOZE_PRESENCE", { slug: activeSlug, duration: duration * 60 * 1000 });
    onClose();
  };

  const handleClearSnooze = (): void => {
    if (!activeSlug) return;
    void sendMessage("CLEAR_SNOOZE", { slug: activeSlug });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} position="bottom" subtitle={t("snooze-description")} title={t("snooze")}>
      <div className="flex flex-col gap-4">

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="unstyled"
            size="none"
            onClick={dec}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card-2 text-foreground transition-colors hover:bg-card-hover"
            aria-label="Decrease duration"
          >
            <IconMinus className="h-4 w-4" />
          </Button>

          <span className="min-w-18 text-center text-base font-semibold text-foreground tabular-nums">
            {formatDuration(duration)}
          </span>

          <Button
            variant="unstyled"
            size="none"
            onClick={inc}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card-2 text-foreground transition-colors hover:bg-card-hover"
            aria-label="Increase duration"
          >
            <IconPlus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="unstyled"
          size="none"
          onClick={handleSnooze}
          className="w-full rounded-lg border border-border bg-card-2 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-card-hover"
        >
          {t("snooze")}
        </Button>

        {isSnoozed ? (
          <Button
            variant="unstyled"
            size="none"
            onClick={handleClearSnooze}
            className="w-full rounded-lg border border-border bg-card-2 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
          >
            {t("clear-snooze")}
          </Button>
        ) : null}
      </div>
    </Sheet>
  );
};