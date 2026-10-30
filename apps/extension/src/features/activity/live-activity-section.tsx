import { CustomActivityLiveCard } from "@/components/shared/custom-activity-live-card";
import { LiveCard } from "@/components/shared/live-activity-card";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { connectionOf } from "@/lib/presence-status";
import { sendMessage } from "@/lib/messages";
import { customActivityIdOf } from "@/shared/custom-activity";
import { discordIpcIssueOf } from "@/shared/discord-ipc-prompt";
import { Section } from "@/ui/section";
import { DiscordIpcAlert } from "@/features/activity/discord-ipc-alert";
import { IdleCard } from "@/features/activity/idle-activity-card";

type LiveActivitySectionProps = {
  hasPresences: boolean;
};

export const LiveActivitySection = ({ hasPresences }: LiveActivitySectionProps) => {
  const { state, updateSettings, refresh } = useExtensionState();
  const { t } = useI18n();
  const { push } = useNav();
  const { activity, presences, settings } = state;
  const paused = settings.presencePaused === true;
  const liveStored = activity ? presences[activity.slug] : undefined;
  const resume = () => void updateSettings({ presencePaused: false });
  const customId = customActivityIdOf(activity?.slug);
  const custom = customId ? state.customActivities.items.find((item) => item.id === customId) : undefined;
  const stopCustom = async () => {
    await sendMessage("SET_CUSTOM_ACTIVITY_ACTIVE", { id: null });
    await Promise.all([
      refresh.customActivities(),
      refresh.activity()
    ]);
  };
  const connection = connectionOf(state.native);
  const ipcBlocked = discordIpcIssueOf(state.native).active;

  if (!hasPresences && state.customActivities.items.length === 0) return null;

  if (settings.showPlayer === false) {
    return ipcBlocked ? (
      <Section title={t("activity.now")}>
        <DiscordIpcAlert />
      </Section>
    ) : null;
  }

  return (
    <Section title={t("activity.now")}>
      {ipcBlocked && <DiscordIpcAlert />}
      {activity && custom ? (
        <CustomActivityLiveCard
          activity={custom}
          presence={activity.presence}
          paused={paused}
          onOpen={() =>
            push({
              name: "custom-activity",
              id: custom.id
            })
          }
          onStop={stopCustom}
          onResume={resume}
        />
      ) : activity && liveStored ? (
        <LiveCard
          slug={activity.slug}
          presence={activity.presence}
          presenceName={liveStored.metadata.name}
          t={t}
          status={paused ? "paused" : "live"}
          statusLabel={paused ? t("activity.pausedLabel") : undefined}
          onOpen={() =>
            push({
              name: "presence",
              slug: activity.slug
            })
          }
        />
      ) : ipcBlocked && !paused && connection === "no-discord" ? null : (
        <IdleCard connection={connection} paused={paused} onResume={resume} hasPresences={hasPresences} />
      )}
    </Section>
  );
};