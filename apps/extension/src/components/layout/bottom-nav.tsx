import { Button } from "@/components/ui/button";
import { IconHome, IconListTree, IconSettings } from "@/lib/tabler-icons";
import { t } from "@/shared/i18n";
import type { FC, KeyboardEvent, ReactElement } from "react";
import { useRef } from "react";

export type AppView = "home" | "settings" | "logs";

type Props = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  showLogs?: boolean;
};

type Tab = {
  view: AppView;
  icon: typeof IconHome;
  label: Parameters<typeof t>[0];
};

export const BottomNav: FC<Props> = ({ activeView, onViewChange, showLogs = false }): ReactElement => {
  const tabs: Tab[] = [
    { view: "home", icon: IconHome, label: "nav-home" },
    ...(showLogs ? [{ view: "logs" as const, icon: IconListTree, label: "nav-logs" as const }] : []),
    { view: "settings", icon: IconSettings, label: "nav-settings" },
  ];
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTab = (index: number): void => {
    const next = tabs[index];
    if (!next) return;
    onViewChange(next.view);
    tabRefs.current[index]?.focus();
  };

  const onTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const currentIndex = tabs.findIndex((tab) => tab.view === activeView);
    if (currentIndex < 0) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusTab((currentIndex + 1) % tabs.length);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusTab((currentIndex - 1 + tabs.length) % tabs.length);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusTab(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusTab(tabs.length - 1);
    }
  };

  return (
    <nav className="shrink-0 px-3 pb-3">
      <div
        role="tablist"
        aria-label={t("nav-tablist")}
        onKeyDown={onTabListKeyDown}
        className={`grid overflow-hidden rounded-xl border border-border bg-card ${showLogs ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = activeView === tab.view;
          const tabId = `sidepanel-tab-${tab.view}`;

          return (
            <Button
              key={tab.view}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={tabId}
              role="tab"
              variant="unstyled"
              size="none"
              aria-label={t(tab.label)}
              aria-selected={active}
              aria-controls="sidepanel-tabpanel"
              tabIndex={active ? 0 : -1}
              onClick={() => onViewChange(tab.view)}
              className={`relative isolate flex flex-col items-center gap-1 overflow-hidden px-2 py-2.5 transition-colors ${
                active ? "text-accent" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                aria-hidden
                className={`pointer-events-none absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent blur-2xl transition-opacity duration-300 ${
                  active ? "opacity-40" : "opacity-0"
                }`}
              />
              <Icon className="relative size-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="relative text-xs font-medium leading-none">{t(tab.label)}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
