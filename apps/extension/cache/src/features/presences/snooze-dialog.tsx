import { Dialog, dialogPrimaryClassName, dialogSecondaryClassName } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { InstalledPresences } from "@/shared/types";
import { IconMinus, IconPlus } from "@/lib/tabler-icons";
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

export const SnoozeDialog: FC<Props> = ({ activeSlug, onClose, open, presences }): ReactElement | null => {
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

  const handleSnoozeUntilMidnight = (): void => {
    if (!activeSlug) return;
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const duration = Math.max(60 * 1000, midnight.getTime() - now.getTime());
    void sendMessage("SNOOZE_PRESENCE", { slug: activeSlug, duration });
    onClose();
  };

  const handleClearSnooze = (): void => {
    if (!activeSlug) return;
    void sendMessage("CLEAR_SNOOZE", { slug: activeSlug });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      subtitle={t("snooze-description")}
      title={t("snooze")}
      footer={(
        <>
          <Button variant="unstyled" size="none" onClick={handleSnooze} className={dialogPrimaryClassName}>
            {t("snooze")}
          </Button>
          <Button variant="unstyled" size="none" onClick={handleSnoozeUntilMidnight} className={dialogSecondaryClassName}>
            {t("snooze-until-midnight")}
          </Button>
          {isSnoozed ? (
            <Button variant="unstyled" size="none" onClick={handleClearSnooze} className={dialogSecondaryClassName}>
              {t("clear-snooze")}
            </Button>
          ) : null}
        </>
      )}
    >
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="unstyled"
          size="none"
          onClick={dec}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-card-2 text-foreground transition-colors hover:bg-card-hover"
          aria-label="Decrease duration"
        >
          <IconMinus className="size-4" />
        </Button>

        <span className="min-w-18 text-center text-base font-semibold tabular-nums text-foreground">
          {formatDuration(duration)}
        </span>

        <Button
          variant="unstyled"
          size="none"
          onClick={inc}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-card-2 text-foreground transition-colors hover:bg-card-hover"
          aria-label="Increase duration"
        >
          <IconPlus className="size-4" />
        </Button>
      </div>
    </Dialog>
  );
};
