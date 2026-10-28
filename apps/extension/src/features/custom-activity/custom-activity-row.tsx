import { useEffect, useState } from "react";
import { RiShareForwardLine } from "@remixicon/react";
import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { useI18n } from "@/hooks/i18n-provider";
import { sendMessage } from "@/lib/messages";
import type { CustomActivity } from "@/shared/types";
import { Badge } from "@/ui/badge";
import { DotSeparator } from "@/ui/dot-separator";
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
  const [published, setPublished] = useState(false);
  const lines = [activity.details, activity.state].filter(Boolean);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      void sendMessage("GET_OWN_ACTIVITY_PUBLICATION", { id: activity.id })
        .then((result) => {
          if (!cancelled && result.ok) setPublished(Boolean(result.url && result.published));
        })
        .catch(() => {});
    load();
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [activity.id]);

  const running = active || Boolean(detectedHost);
  return (
    <Row
      onClick={onOpen}
      className={
        active
          ? "relative before:absolute before:top-1/2 before:left-0 before:h-8 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-['']"
          : undefined
      }
      leading={<CustomActivityArtwork source={activity} size={36} />}
      title={
        <span className="flex items-center gap-2">
          <span className="truncate">{activity.name}</span>
          {published && (
            <Badge tone="neutral" icon={<RiShareForwardLine />}>
              {t("custom.list.shared")}
            </Badge>
          )}
          {running && (detectedHost || paused) && (
            <Badge tone={detectedHost ? "primary" : "neutral"}>{detectedHost ? t("custom.detection.badge") : t("custom.list.paused")}</Badge>
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