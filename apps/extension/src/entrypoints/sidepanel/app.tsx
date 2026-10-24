import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { RiApps2Fill, RiApps2Line, RiQuillPenFill, RiQuillPenLine, RiPulseFill, RiPulseLine, RiSettings3Fill, RiSettings3Line } from "@remixicon/react";
import { FeatureReveal } from "@/components/shared/feature-reveal";
import { Dock } from "@/features/layout/dock";
import { DOCK_TABS, normalizeDockLayout, visibleDockTabs } from "@/shared/dock-layout";
import { useResolvedTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav, type Route, type Tab } from "@/hooks/navigation-provider";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { FeatureRevealProvider } from "@/hooks/feature-reveal-provider";
import { ActivityView } from "@/features/activity/activity-view";
import { DiscordIpcPrompt } from "@/features/discord-ipc/discord-ipc-prompt";
import { AccountChoicePrompt } from "@/features/settings/account-choice-sheet";
import { Header } from "@/features/layout/header";
import { Layer } from "@/features/layout/layer";
import { ReviewPrompt } from "@/features/review/review-prompt";
import { HalloweenPrank } from "@/features/seasonal/halloween-prank";
import { SeasonMoment } from "@/features/seasonal/season-moment";
import { LegalGate } from "@/features/legal/legal-gate";
import { Skeleton } from "@/ui/skeleton";

const CustomActivityEditorView = lazy(async () => ({
  default: (await import("@/features/custom-activity/custom-activity-editor-view")).CustomActivityEditorView
}));
const CustomActivityView = lazy(async () => ({ default: (await import("@/features/custom-activity/custom-activity-view")).CustomActivityView }));
const ConnectionView = lazy(async () => ({ default: (await import("@/features/diagnostics/connection-view")).ConnectionView }));
const DiscordIpcView = lazy(async () => ({ default: (await import("@/features/discord-ipc/discord-ipc-view")).DiscordIpcView }));
const LibraryView = lazy(async () => ({ default: (await import("@/features/library/library-view")).LibraryView }));
const RuntimeLogsView = lazy(async () => ({ default: (await import("@/features/runtime-logs/runtime-logs-view")).RuntimeLogsView }));
const OnboardingView = lazy(async () => ({ default: (await import("@/features/onboarding/onboarding-view")).OnboardingView }));
const PresenceDetailView = lazy(async () => ({ default: (await import("@/features/presence/presence-detail-view")).PresenceDetailView }));
const SettingsView = lazy(async () => ({ default: (await import("@/features/settings/settings-view")).SettingsView }));

const PanelLoading = () => (
  <div aria-busy="true" className="flex flex-col gap-4 p-5">
    <Skeleton className="h-6 w-1/2" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

const TABS = DOCK_TABS;
const CUSTOM_ACTIVITY_REVEAL = {
  id: "custom-activity",
  version: "2.4.0"
} as const;
const ACCOUNT_SYNC_REVEAL = {
  id: "account-sync",
  version: "2.3.0"
} as const;

const routeKey = (route: Route, depth: number) => `${depth}:${JSON.stringify(route)}`;

export const App = () => (
  <LegalGate>
    <AppContent />
  </LegalGate>
);

const AppContent = () => {
  const { state, updateSettings } = useExtensionState();
  const { t } = useI18n();
  const { tab, stack, setTab } = useNav();
  const theme = useResolvedTheme(state.settings.appearance);
  const mainRef = useRef<HTMLElement>(null);
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set([tab]));

  useEffect(() => {
    setVisited((current) => (current.has(tab) ? current : new Set(current).add(tab)));
  }, [tab]);

  const onboarding = state.ready && (!state.onboarding.onboardingCompleted || state.onboarding.devReplayOnboarding);

  if (onboarding) {
    return (
      <main className="scroll-thin h-full overflow-y-auto">
        <Suspense fallback={<PanelLoading />}>
          <OnboardingView theme={theme} />
        </Suspense>
      </main>
    );
  }

  const live = Boolean(state.activity) && !state.settings.presencePaused;

  const selectTab = (next: Tab) => {
    if (next === tab && stack.length === 0) {
      mainRef.current?.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      return;
    }

    setTab(next);
  };

  return (
    <FeatureRevealProvider enabled={state.ready && stack.length === 0}>
      <main ref={mainRef} className="relative h-full overflow-hidden">
        {TABS.filter((value) => visited.has(value)).map((value) => (
          <Layer key={value} tab={value} active={stack.length === 0 && value === tab}>
            <Header theme={theme} />
            <Suspense fallback={<PanelLoading />}>
              {value === "activity" && <ActivityView />}
              {value === "store" && <LibraryView />}
              {value === "custom" && <CustomActivityView />}
              {value === "settings" && <SettingsView />}
            </Suspense>
          </Layer>
        ))}
        {stack.map((route, depth) => (
          <Layer key={routeKey(route, depth)} active={depth === stack.length - 1} className="animate-push bg-canvas">
            <Suspense fallback={<PanelLoading />}>
              {route.name === "presence" && <PresenceDetailView slug={route.slug} />}
              {route.name === "connection" && <ConnectionView />}
              {route.name === "logs" && <RuntimeLogsView />}
              {route.name === "custom-activity" && <CustomActivityEditorView id={route.id} template={route.template} />}
              {route.name === "discord-ipc" && <DiscordIpcView />}
            </Suspense>
          </Layer>
        ))}
        <Dock<Tab>
          label={t("nav.label")}
          layout={normalizeDockLayout(state.settings.dockLayout, visibleDockTabs(state.settings.hiddenDockTabs))}
          onLayoutChange={(dockLayout) => void updateSettings({ dockLayout })}
          value={tab}
          onChange={selectTab}
          items={[
            {
              value: "activity",
              label: t("nav.activity"),
              icon: <RiPulseLine className="size-[18px]" />,
              activeIcon: <RiPulseFill className="size-[18px]" />,
              badge: live ? "live" : undefined
            },
            {
              value: "store",
              label: t("nav.library"),
              icon: <RiApps2Line className="size-[18px]" />,
              activeIcon: <RiApps2Fill className="size-[18px]" />
            },
            {
              value: "custom",
              label: t("nav.custom"),
              icon: <RiQuillPenLine className="size-[18px]" />,
              activeIcon: <RiQuillPenFill className="size-[18px]" />,
              wrap: (button) => (
                <FeatureReveal {...CUSTOM_ACTIVITY_REVEAL} text={t("reveal.customActivity")} hint={t("reveal.customActivityHint")}>
                  {button}
                </FeatureReveal>
              )
            },
            {
              value: "settings",
              label: t("nav.settings"),
              icon: <RiSettings3Line className="size-[18px]" />,
              activeIcon: <RiSettings3Fill className="size-[18px]" />,
              wrap: (button) => (
                <FeatureReveal {...ACCOUNT_SYNC_REVEAL} text={t("reveal.accountSync")} hint={t("reveal.accountSyncHint")}>
                  {button}
                </FeatureReveal>
              )
            }
          ]}
        />
        <ReviewPrompt />
        <DiscordIpcPrompt />
        <HalloweenPrank />
        <SeasonMoment />
        <AccountChoicePrompt />
      </main>
    </FeatureRevealProvider>
  );
};
