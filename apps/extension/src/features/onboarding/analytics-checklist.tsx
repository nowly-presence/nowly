import { t } from "@/shared/i18n";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { FC } from "react";

type MessageKey = Parameters<typeof t>[0];

const notCollectedItems: MessageKey[] = [
  "analytics-not-collect-urls",
  "analytics-not-collect-titles",
  "analytics-not-collect-searches",
  "analytics-not-collect-content",
  "analytics-not-collect-ips",
  "analytics-not-collect-ids",
];

export const AnalyticsChecklist: FC = () => (
  <div className="mt-5 grid grid-cols-2 gap-1.5 text-left">
    {notCollectedItems.map((key) => (
      <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 py-2">
        <IconX className="h-3.5 w-3.5 shrink-0 text-red-400" />
        <span className="text-xs text-muted-foreground">{t(key)}</span>
      </div>
    ))}
    <div className="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-border bg-card-2 px-2.5 py-2">
      <IconCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="text-xs text-foreground">{t("analytics-collect-usage")}</span>
    </div>
    <p className="col-span-2 text-center text-xs leading-5 text-dim-foreground">{t("onboarding-analytics-delete")}</p>
  </div>
);