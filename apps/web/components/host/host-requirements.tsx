import type { Platform } from "@/hooks/use-platform";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  platform: Exclude<Platform, "">;
};

const requirementKeys: Record<Exclude<Platform, "">, Array<{ label: string; value: string }>> = {
  windows: [
    { label: "req-os", value: "req-os-windows-value" },
    { label: "req-arch", value: "req-arch-windows-value" },
    { label: "req-discord", value: "req-discord-value" },
    { label: "req-browser", value: "req-browser-value" },
    { label: "req-storage", value: "req-storage-windows-value" },
  ],
  macos: [
    { label: "req-os", value: "req-os-macos-value" },
    { label: "req-arch", value: "req-arch-macos-value" },
    { label: "req-discord", value: "req-discord-value" },
    { label: "req-browser", value: "req-browser-value" },
    { label: "req-storage", value: "req-storage-macos-value" },
  ],
  linux: [
    { label: "req-os", value: "req-os-linux-value" },
    { label: "req-arch", value: "req-arch-linux-value" },
    { label: "req-discord", value: "req-discord-value" },
    { label: "req-browser", value: "req-browser-value" },
    { label: "req-storage", value: "req-storage-linux-value" },
  ],
};

export const HostRequirements: FC<Props> = ({ platform }): ReactElement => {
  const t = useTranslations("host-page");
  const reqs = requirementKeys[platform];

  return (
    <section id="requirements" className="scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight mb-6">{t("req-title")}</h2>

      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {reqs.map((req) => (
          <div key={req.value} className="flex items-center justify-between gap-4 px-6 py-4">
            <span className="text-sm text-muted-foreground">{t(req.label)}</span>
            <span className="text-sm font-medium text-right">{t(req.value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
