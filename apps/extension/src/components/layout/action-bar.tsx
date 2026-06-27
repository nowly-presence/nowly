import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconCalendar, IconRefresh, IconSnowflake, IconSun, IconWand } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useRef } from "react";

const CHECK_RATE_LIMIT_MS = 30_000;

type Props = {
  activeSlug: string | null;
  backgroundAnimation: boolean;
  isCheckingUpdates: boolean;
  isSnoozed: boolean;
  scheduleEnabled: boolean;
  onCheckUpdates: () => void;
  onScheduleClick: () => void;
  onSnoozeClick: () => void;
  onToggleAnimation: () => void;
  onUnsnoozeClick: () => void;
};

export const ActionBar: FC<Props> = ({ activeSlug, backgroundAnimation, isCheckingUpdates, isSnoozed, scheduleEnabled, onCheckUpdates, onScheduleClick, onSnoozeClick, onToggleAnimation, onUnsnoozeClick }): ReactElement => {
  const lastCheckRef = useRef(0);

  const handleCheckUpdates = (): void => {
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_RATE_LIMIT_MS) return;
    lastCheckRef.current = now;
    onCheckUpdates();
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
      {isSnoozed ? (
        <Button
          variant="unstyled"
          size="none"
          aria-label={t("clear-snooze")}
          onClick={onUnsnoozeClick}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
        >
          <IconSun className="h-3.5 w-3.5" />
          {t("clear-snooze")}
        </Button>
      ) : (
        <Button
          variant="unstyled"
          size="none"
          aria-label={t("snooze")}
          disabled={!activeSlug}
          onClick={onSnoozeClick}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        >
          <IconSnowflake className="h-3.5 w-3.5" />
          {t("snooze")}
        </Button>
      )}

      {scheduleEnabled ? (
        <>
          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            variant="unstyled"
            size="none"
            aria-label={t("schedule")}
            onClick={onScheduleClick}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
          >
            <IconCalendar className="h-3.5 w-3.5" />
            {t("schedule")}
          </Button>
        </>
      ) : null}

      <div className="mx-1 h-4 w-px bg-border" />

      <Button
        variant="unstyled"
        size="none"
        aria-label={t("check-updates")}
        title={t("check-updates")}
        onClick={handleCheckUpdates}
        disabled={isCheckingUpdates}
        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground disabled:opacity-50"
      >
        <IconRefresh className={`h-3.5 w-3.5 ${isCheckingUpdates ? "animate-spin" : ""}`} />
        {t("check-updates")}
      </Button>

      <Button
        variant="unstyled"
        size="none"
        aria-label={t("bg-animation")}
        title={t("bg-animation")}
        onClick={onToggleAnimation}
        className={`ml-auto inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors hover:bg-card-2 ${
          backgroundAnimation
            ? "text-accent hover:text-accent"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <IconWand className="h-3.5 w-3.5" />
        {t("bg-animation")}
      </Button>
    </div>
  );
};