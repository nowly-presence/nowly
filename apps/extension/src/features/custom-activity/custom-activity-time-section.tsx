import { RiAddLine, RiSubtractLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";
import { useNow } from "@/hooks/use-now";
import { formatDuration, formatTime } from "@/lib/format";
import {
  clampCountdown,
  CUSTOM_COUNTDOWN_MAX_MINUTES,
  CUSTOM_COUNTDOWN_MIN_MINUTES,
  CUSTOM_COUNTDOWN_PRESETS,
  CUSTOM_COUNTDOWN_STEP_MINUTES,
} from "@/shared/custom-activity";
import type { CustomTimestamp } from "@/shared/types";
import { Button } from "@/ui/button";
import { Group } from "@/ui/card";
import { Chip } from "@/ui/chip";
import { FieldRow } from "@/ui/field-row";
import { Section } from "@/ui/section";
import { Segmented } from "@/ui/segmented";
import { FieldError } from "@/features/custom-activity/custom-field-error";
import type { CustomActivitySectionProps } from "@/features/custom-activity/custom-activity-section-props";

type TimestampMode = CustomTimestamp["mode"];

const DEFAULT_COUNTDOWN_MINUTES = 25;
const MINUTE_MS = 60_000;

export const CustomActivityTimeSection = ({
  draft,
  patch,
  errors,
}: CustomActivitySectionProps) => {
  const { t, locale } = useI18n();
  const now = useNow(MINUTE_MS);
  const { timestamp } = draft;

  const setMode = (mode: TimestampMode) =>
    patch({
      timestamp:
        mode === "countdown"
          ? {
              mode,
              minutes:
                timestamp.mode === "countdown"
                  ? timestamp.minutes
                  : DEFAULT_COUNTDOWN_MINUTES,
            }
          : { mode },
    });
  const setMinutes = (minutes: number) =>
    patch({
      timestamp: { mode: "countdown", minutes: clampCountdown(minutes) },
    });

  return (
    <Section title={t("custom.editor.timeSection")}>
      <Group>
        <FieldRow
          layout="stacked"
          spacing="relaxed"
          title={t("custom.field.timer")}
          description={t(`custom.timer.${timestamp.mode}Hint`)}
        >
          <Segmented<TimestampMode>
            label={t("custom.field.timer")}
            value={timestamp.mode}
            onChange={setMode}
            options={[
              { value: "elapsed", label: t("custom.timer.elapsed") },
              { value: "countdown", label: t("custom.timer.countdown") },
            ]}
          />
          {timestamp.mode === "countdown" && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 rounded-md border border-line bg-canvas p-1.5">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("custom.timer.decrease")}
                  disabled={timestamp.minutes <= CUSTOM_COUNTDOWN_MIN_MINUTES}
                  onClick={() =>
                    setMinutes(
                      timestamp.minutes - CUSTOM_COUNTDOWN_STEP_MINUTES,
                    )
                  }
                >
                  <RiSubtractLine className="size-4" />
                </Button>
                <span
                  className="text-headline-sm font-medium text-ink tabular-nums"
                  aria-live="polite"
                >
                  {formatDuration(timestamp.minutes, locale)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("custom.timer.increase")}
                  disabled={timestamp.minutes >= CUSTOM_COUNTDOWN_MAX_MINUTES}
                  onClick={() =>
                    setMinutes(
                      timestamp.minutes + CUSTOM_COUNTDOWN_STEP_MINUTES,
                    )
                  }
                >
                  <RiAddLine className="size-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CUSTOM_COUNTDOWN_PRESETS.map((minutes) => (
                  <Chip
                    key={minutes}
                    active={timestamp.minutes === minutes}
                    onClick={() => setMinutes(minutes)}
                  >
                    {formatDuration(minutes, locale)}
                  </Chip>
                ))}
              </div>
              <p className="text-label-md text-muted">
                {t("custom.timer.endsAt", {
                  time: formatTime(now + timestamp.minutes * MINUTE_MS, locale),
                })}
              </p>
              <FieldError error={errors.countdown} />
            </div>
          )}
        </FieldRow>
      </Group>
    </Section>
  );
};