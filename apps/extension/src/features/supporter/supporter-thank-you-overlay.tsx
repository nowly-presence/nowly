import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import type { SupporterStatus } from "@/shared/types";
import { IconCircleCheckFilled, IconCopy } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useState } from "react";

type Props = {
  status: SupporterStatus;
  onClose: () => void;
};

export const SupporterThankYouOverlay: FC<Props> = ({ status, onClose }): ReactElement | null => {
  const [copied, setCopied] = useState(false);

  if (!status.adFree || !status.showThankYou) return null;

  const deviceId = status.deviceId ?? "";

  const copyDeviceId = (): void => {
    if (!deviceId) return;
    void navigator.clipboard.writeText(deviceId).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-60">
      <div className="absolute inset-0 bg-[#FEE961]/15 backdrop-blur-md" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(254,233,97,0.36),transparent_42%),radial-gradient(circle_at_20%_80%,rgba(254,233,97,0.18),transparent_36%)]" />

      <div className="pointer-events-auto absolute inset-0 flex min-h-0 items-center justify-center p-4">
        <section className="relative w-full max-w-sm overflow-hidden rounded-lg border border-[#FEE961]/30 bg-card/90 p-5 text-center shadow-[0_24px_70px_rgba(0,0,0,.6)]">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#FEE961] to-transparent" />

          <h1 className="mt-2 text-xl font-semibold text-foreground">{t("supporter-thanks-title")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("supporter-thanks-description")}</p>

          <div className="mt-5 rounded-lg border border-border bg-background/70 p-3 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <IconCircleCheckFilled className="size-4 text-[#FEE961]" />
              {t("supporter-discord-title")}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{t("supporter-discord-description")}</p>
            {deviceId ? (
              <button
                type="button"
                onClick={copyDeviceId}
                className="mt-3 flex w-full items-center justify-between gap-2 rounded-md border border-border bg-card-2 px-3 py-2 text-left font-mono text-[11px] text-foreground transition-colors hover:bg-card-hover"
              >
                <span className="min-w-0 truncate">{deviceId}</span>
                <IconCopy className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
            ) : null}
            <p className="mt-2 text-xs leading-5 text-dim-foreground">
              {copied ? t("supporter-device-copied") : t("supporter-discord-command")}
            </p>
          </div>

          <Button className="mt-5 w-full bg-[#FEE961] text-black hover:brightness-110" variant="unstyled" size="md" onClick={onClose}>
            {t("supporter-thanks-close")}
          </Button>
        </section>
      </div>
    </div>
  );
};
