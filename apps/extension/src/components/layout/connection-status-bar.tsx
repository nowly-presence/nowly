import { Button } from "@/components/ui/button";
import type { NativeStatus } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { FC, ReactElement } from "react";

type Props = {
  nativeStatus: NativeStatus;
  onConnect: () => void;
  visible: boolean;
};

type Tone = {
  stripe: string;
  label: string;
  actionable: boolean;
};

export const isConnectionHealthy = (ns: NativeStatus): boolean => Boolean(ns.discordConnected);

const toneFor = (ns: NativeStatus): Tone => {
  if (ns.discordConnected) {
    return { stripe: "bg-accent", label: t("status-bar-discord-connected"), actionable: false };
  }
  if (ns.connected && !ns.discordConnected) {
    return { stripe: "bg-amber-400", label: t("status-bar-discord-closed"), actionable: false };
  }
  if (ns.status === "connecting") {
    return { stripe: "bg-zinc-400", label: t("status-bar-checking"), actionable: false };
  }
  return { stripe: "bg-red-500", label: t("status-bar-host-missing"), actionable: true };
};

export const ConnectionStatusBar: FC<Props> = ({ nativeStatus, onConnect, visible }): ReactElement => {
  const tone = toneFor(nativeStatus);

  return (
    <div className={`grid shrink-0 transition-[grid-template-rows] duration-300 ease-out ${visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
      <div className="overflow-hidden">
        <Button
          variant="unstyled"
          size="none"
          type="button"
          disabled={!tone.actionable}
          onClick={tone.actionable ? onConnect : undefined}
          aria-hidden={!visible}
          aria-label={tone.label}
          className={`flex h-9 w-full items-stretch bg-card ${
            tone.actionable ? "cursor-pointer hover:bg-card-2" : "cursor-default"
          }`}
        >
          <span aria-hidden className={`w-1 shrink-0 ${tone.stripe}`} />
          <span className="flex flex-1 items-center justify-center px-3 text-center text-xs font-medium text-foreground">
            {tone.label}
          </span>
        </Button>
      </div>
    </div>
  );
};
