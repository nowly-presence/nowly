import { CustomActivityArtwork } from "@/components/shared/custom-activity-artwork";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { sendMessage } from "@/lib/messages";
import { Group } from "@/ui/card";
import { Button } from "@/ui/button";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { Switch } from "@/ui/switch";
import type { CustomActivity } from "@/shared/types";
import { DotSeparator } from "@/ui/dot-separator";

export const CustomActivitiesSection = () => {
  const { state, refresh } = useExtensionState();
  const { t } = useI18n();
  const { push, setTab } = useNav();
  const { items, activeId } = state.customActivities;

  if (state.settings.showCustomActivitiesInActivity === false || items.length === 0) return null;

  const open = (activity: CustomActivity) =>
    push({
      name: "custom-activity",
      id: activity.id
    });
  const toggle = async (id: string | null) => {
    await sendMessage("SET_CUSTOM_ACTIVITY_ACTIVE", { id });
    await Promise.all([
      refresh.customActivities(),
      refresh.activity()
    ]);
  };

  return (
    <Section
      title={t("activity.customActivities")}
      action={
        <Button variant="link" onClick={() => setTab("custom")}>
          {t("activity.manageCustomActivities")}
        </Button>
      }
    >
      <Group>
        {items.map((activity) => {
          const detectedHost = state.detection?.activityId === activity.id ? state.detection.host : undefined;
          const active = activeId === activity.id || Boolean(detectedHost);
          const lines = [activity.details, activity.state].filter(Boolean);

          return (
            <Row
              key={activity.id}
              onClick={() => open(activity)}
              leading={<CustomActivityArtwork source={activity} size={36} />}
              title={activity.name}
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
              trailing={<Switch checked={active} label={t("custom.list.showOnDiscord")} onChange={(checked) => void toggle(checked ? activity.id : null)} />}
            />
          );
        })}
      </Group>
    </Section>
  );
};