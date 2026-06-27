import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconActivity, IconListTree, IconSettings } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";

export type SidepanelView = "activity" | "settings" | "analyticsLogs";

type Props = {
  activeView: SidepanelView;
  onChange: (view: SidepanelView) => void;
  showAnalyticsLogs?: boolean;
};

type TranslationKey = Parameters<typeof t>[0];

const items: Array<{ icon: typeof IconActivity; label: TranslationKey; view: SidepanelView }> = [
  { icon: IconActivity, label: "activity-tab", view: "activity" },
  { icon: IconSettings, label: "settings-tab", view: "settings" },
  { icon: IconListTree, label: "analytics-logs-tab", view: "analyticsLogs" },
];

export const SidepanelNav: FC<Props> = ({ activeView, onChange, showAnalyticsLogs = false }): ReactElement => {
  const visibleItems = items.filter((item) => item.view !== "analyticsLogs" || showAnalyticsLogs);

  return (
    <nav role="tablist" className={`grid gap-1 rounded-lg border border-border bg-card p-1 ${visibleItems.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.view;

        return (
          <Button
            key={item.view}
            role="tab"
            aria-selected={active}
            aria-label={t(item.label)}
            variant="unstyled"
            size="none"
            onClick={() => onChange(item.view)}
            className={
              active
                ? "flex h-9 items-center justify-center gap-1.5 rounded-md bg-card-2 text-xs font-semibold text-foreground"
                : "flex h-9 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-card-2 hover:text-foreground"
            }
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="truncate">{t(item.label)}</span>
          </Button>
        );
      })}
    </nav>
  );
};