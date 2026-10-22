import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { useI18n } from "@/hooks/i18n-provider";
import type { CustomActivity } from "@/shared/types";
import { Badge } from "@/ui/badge";
import { DotSeparator } from "@/ui/dot-separator";
import { LiveDot } from "@/ui/live-dot";
import { Row } from "@/ui/row";
import { Switch } from "@/ui/switch";

type CustomActivityRowProps = {
  activity: CustomActivity;
  active: boolean;
  detectedHost?: string;
  paused: boolean;
  onOpen: () => void;
  onToggle: (active: boolean) => void;
};

export const CustomActivityRow = ({ activity, active, detectedHost, paused, onOpen, onToggle }: CustomActivityRowProps) => {
  const { t } = useI18n();
  const lines = [activity.details, activity.state].filter(Boolean);
  const running = active || Boolean(detectedHost);
  return (
    <Row
      onClick={onOpen}
      leading={<CustomActivityArtwork source={activity} size={36} />}
      title={
        <span className="flex items-center gap-2">
          <span className="truncate">{activity.name}</span>
          {running && (
            <Badge tone={detectedHost ? "primary" : paused ? "neutral" : "success"} icon={detectedHost || paused ? undefined : <LiveDot />}>
              {detectedHost ? t("custom.detection.badge") : paused ? t("custom.list.paused") : t("custom.list.live")}
            </Badge>
          )}
        </span>
      }
      description={
        lines.length > 0 ? (
          <span className="flex min-w-0 items-center gap-1.5">
            {lines.map((line, index) => (
              <span key={index} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && <DotSeparator />}
                <span className="truncate">{line}</span>
              </span>
            ))}
          </span>
        ) : (
          t("custom.list.noDetails")
        )
      }
      trailing={<Switch checked={running} label={t("custom.list.showOnDiscord")} onChange={onToggle} />}
    />
  );
};