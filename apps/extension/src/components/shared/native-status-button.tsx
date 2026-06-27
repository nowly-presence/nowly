import { Button } from "@/components/ui/button";
import type { NativeStatus } from "@/lib/messages";
import { t } from "@/shared/i18n";
import { IconRefresh, IconWifi, IconWifiOff } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";

type Props = {
  nativeStatus: NativeStatus;
  onConnect: () => void;
};

export const NativeStatusButton: FC<Props> = ({ nativeStatus, onConnect }): ReactElement => {
  const connected = Boolean(nativeStatus.connected || nativeStatus.discordConnected);
  const isConnecting = nativeStatus.status === "connecting";
  const Icon = connected ? IconWifi : IconWifiOff;
  const label = nativeStatus.discordConnected
    ? t("diagnostic-discord-connected-message")
    : connected
      ? t("diagnostic-discord-closed-short")
      : t("native-disconnected");
  const iconClass = nativeStatus.discordConnected
    ? "h-3.5 w-3.5 text-accent"
    : connected
      ? "h-3.5 w-3.5 text-amber-400"
      : "h-3.5 w-3.5 text-destructive";

  return (
    <Button
      variant="unstyled"
      size="none"
      aria-label={t("connect-native")}
      title={label}
      onClick={onConnect}
      disabled={isConnecting}
      className="group flex h-9 items-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground disabled:cursor-wait disabled:opacity-70"
    >
      <Icon className={iconClass} />
      <span>{label}</span>
      <IconRefresh className={`h-3.5 w-3.5 ${isConnecting ? "animate-spin" : "opacity-60 group-hover:opacity-100"}`} />
    </Button>
  );
};
