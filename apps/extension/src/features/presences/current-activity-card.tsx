import { Skeleton } from "@/components/ui/skeleton";
import { getActivitySubtitle, getActivityTitle } from "@/lib/format";
import { assetUrl } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { CurrentActivity, InstalledPresences } from "@/shared/types";
import { IconDisc, IconSnowflake } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import VinylAnimation from "@/features/presences/vinyl-animation";

type Props = {
  activity: CurrentActivity | null;
  isLoading: boolean;
  presences: InstalledPresences;
};

type MediaCategory = "music" | "streaming" | "tv" | "anime" | "other";

const hasProgress = (cat?: MediaCategory) => cat && cat !== "other";
const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  return `${minutes}:${paddedSeconds}`;
};

const useRealtimeProgress = (
  startTime: number | undefined,
  endTime: number | undefined,
): { elapsed: string; duration: string; percent: number } | null => {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!startTime || !endTime) return;
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  if (!startTime || !endTime || endTime <= startTime) return null;

  const duration = endTime - startTime;
  const elapsed = Math.min(Math.max(now - startTime, 0), duration);

  return {
    duration: formatTime(duration),
    elapsed: formatTime(elapsed),
    percent: Math.min(100, Math.max(0, (elapsed / duration) * 100)),
  };
};

const useCountdown = (targetTimestamp: number | undefined): string | null => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetTimestamp || targetTimestamp <= Date.now()) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  if (!targetTimestamp || targetTimestamp <= now) return null;
  return formatTime(Math.ceil((targetTimestamp - now) / 1000));
};

export const CurrentActivityCard: FC<Props> = ({ activity, isLoading, presences }): ReactElement => {
  const presence = activity ? presences[activity.slug] : null;
  const snoozeUntil = activity ? presence?.snoozeUntil : undefined;
  const progress = useRealtimeProgress(
    activity?.presence.startTime,
    activity?.presence.endTime,
  );
  const snoozeRemaining = useCountdown(snoozeUntil);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-border bg-card-2 p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 shrink-0" rounded="lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      </section>
    );
  }

  const hasActivity = Boolean(activity);
  const largeImage = activity?.presence.largeImage;
  const hasLargeImage = Boolean(largeImage);
  const category = presence?.metadata.category as MediaCategory | undefined;
  const title = getActivityTitle(activity, t("nothing-playing"));
  const subtitle = getActivitySubtitle(activity, presence?.metadata.name ?? "0:00 / 0:00");
  const showProgressBar = hasProgress(category) && progress;
  const isSnoozed = Boolean(snoozeRemaining);

  if (!hasActivity) {
    return (
      <section className="relative overflow-hidden rounded-lg border border-border bg-card-2">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(135deg, transparent, color-mix(in srgb, var(--accent) 10%, transparent), transparent, color-mix(in srgb, var(--accent) 5%, transparent), transparent)",
            backgroundSize: "400% 400%",
            animation: "gradient-drift 10s ease-in-out infinite",
          }}
        />
        <style>{`@keyframes gradient-drift { 0%,to { background-position:0% 50%;} 25% { background-position:100% 0%;} 50% { background-position:100% 100%;} 75% { background-position:0% 100%;} }`}</style>
        <div className="relative z-1 flex items-center gap-3 p-3">
          <VinylAnimation size={48} />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{title}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-lg border border-border bg-card-2">
      {hasLargeImage && (
        <>
          <div
            className="absolute -inset-x-8 -inset-y-6 bg-cover bg-center opacity-40 blur-2xl saturate-50"
            style={{ backgroundImage: `url("${largeImage}")` }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-card-2/60 via-card-2/80 to-card-2/60" />
        </>
      )}
      <div className="relative z-1 flex items-center gap-3 p-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
            hasLargeImage ? "border border-border shadow-md" : ""
          }`}
          style={{ backgroundColor: presence ? `${presence.metadata.color}20` : undefined }}
        >
          {hasLargeImage ? (
            <img src={largeImage} alt="" className="h-full w-full object-cover" />
          ) : presence ? (
            <img src={assetUrl(presence.metadata.slug, "icon")} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <IconDisc className="h-6 w-6 text-dim-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          {isSnoozed ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-card-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <IconSnowflake className="h-3 w-3" />
              {t("snoozed")} {"\u00b7"} {snoozeRemaining}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-1">
        {showProgressBar ? (
          <div className="px-3 pb-3">
            <div className="h-1 overflow-hidden rounded-full bg-accent/15">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{progress.elapsed}</span>
              <span>{progress.duration}</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};
