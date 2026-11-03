import { DiscordAvatar } from "@/components/shared/discord-avatar";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { connectionOf } from "@/lib/presence-status";
import { LiveDot } from "@/ui/live-dot";
import { Row } from "@/ui/row";

export const ConnectionRow = () => {
  const { state } = useExtensionState();
  const { t } = useI18n();
  const { push } = useNav();
  const connection = connectionOf(state.native);
  const profile = connection === "discord" ? state.onboarding.nativeProfile : null;

  return (
    <Row
      onClick={() => push({ name: "connection" })}
      chevron
      leading={<DiscordAvatar profile={profile} size={40} />}
      title={profile ? (profile.globalName ?? profile.username) : t(`connection.state.${connection}`)}
      description={
        <span className="flex items-center gap-1.5">
          {connection === "discord" && <LiveDot pulse={false} />}
          {connection === "discord" ? t("settings.connectedDiscord") : t(`connection.hint.${connection}`)}
        </span>
      }
    />
  );
};