import { RiStopFill } from "@remixicon/react";
import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { LiveCard } from "@/components/shared/live-activity-card";
import { useI18n } from "@/hooks/i18n-provider";
import { customActivitySlug } from "@/shared/custom-activity";
import type { CustomActivity, PresencePayload } from "@/shared/types";
import { Button } from "@/ui/button";

type CustomActivityLiveCardProps = {
  activity: CustomActivity;
  presence: PresencePayload;
  paused: boolean;
  onOpen: () => void;
  onStop: () => void;
  onResume: () => void;
};

export const CustomActivityLiveCard = ({ activity, presence, paused, onOpen, onStop, onResume }: CustomActivityLiveCardProps) => {
  const { t } = useI18n();
  return (
    <LiveCard
      slug={customActivitySlug(activity.id)}
      presence={presence}
      presenceName={activity.name}
      t={t}
      status={paused ? "paused" : "live"}
      statusLabel={paused ? t("activity.pausedLabel") : undefined}
      onOpen={onOpen}
      artwork={<CustomActivityArtwork source={activity} size={64} rounded="rounded-md" showSmall ringClassName="border-tertiary bg-tertiary" />}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-label-md text-on-tertiary-muted">
            <CustomActivityArtwork source={activity} size={18} rounded="rounded-[5px]" />
            <span className="truncate">{t("custom.live.label")}</span>
          </span>
          {paused ? (
            <Button size="sm" variant="inverse" onClick={onResume}>
              {t("action.resume")}
            </Button>
          ) : (
            <button
              type="button"
              onClick={onStop}
              className="flex h-7 items-center gap-1.5 rounded-sm px-2 text-label-md font-medium text-on-tertiary-muted transition-colors hover:bg-tertiary-line hover:text-on-tertiary"
            >
              <RiStopFill className="size-3.5" />
              {t("custom.live.stop")}
            </button>
          )}
        </div>
      }
    />
  );
};