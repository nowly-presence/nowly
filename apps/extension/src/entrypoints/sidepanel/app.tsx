import { BottomNav, type AppView } from "@/components/layout/bottom-nav";
import { ConnectionStatusBar, isConnectionHealthy } from "@/components/layout/connection-status-bar";
import { Header } from "@/components/layout/header";
import { AnalyticsLogsView } from "@/features/analytics-logs/analytics-logs-view";
import { OnboardingOverlay } from "@/features/onboarding/onboarding-overlay";
import { ActivityView } from "@/features/presences/activity-view";
import { CurrentActivityCard } from "@/features/presences/current-activity-card";
import { ScheduleDialog } from "@/features/presences/schedule-dialog";
import { SnoozeDialog } from "@/features/presences/snooze-dialog";
import { SettingsView } from "@/features/settings/settings-view";
import { SupporterThankYouOverlay } from "@/features/supporter/supporter-thank-you-overlay";
import { useExtensionState } from "@/hooks/use-extension-state";
import { useLocalePreference } from "@/hooks/use-locale-preference";
import { useOnboardingState } from "@/hooks/use-onboarding-state";
import { sendMessage } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import { persistAppView } from "@/shared/sidepanel-view";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  initialView: AppView;
};

const App: FC<Props> = ({ initialView }): ReactElement => {
  const { activity, checkHostUpdate, checkUpdates, connectNative, debug, dismissSupporterThankYou, entries, hostVersionInfo, isCheckingHostVersion, isCheckingUpdates, isLoading, isUnpacked, nativeStatus, presences, removePresence, resetOnboardingForDev, supporterStatus, togglePresence, updates, settings, setSettings } =
    useExtensionState();
  const { localePreference, setLocalePreference } = useLocalePreference();
  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts } = useOnboardingState();
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [selectedPresenceSlug, setSelectedPresenceSlug] = useState<string | null>(null);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleSlug, setScheduleSlug] = useState<string | null>(null);
  const liveNativeStatus = onboardingNativeStatus.status === "unknown" && nativeStatus.status !== "unknown"
    ? nativeStatus
    : onboardingNativeStatus;
  const developerModeEnabled = settings.developerMode ?? isUnpacked;

  const [statusVisible, setStatusVisible] = useState(true);

  const onOpenMarketplace = useCallback((slug: string): void => {
    void chrome.tabs.create({ url: `${WEB_BASE_URL}/library/${slug}` });
  }, []);

  const onOpenLibrary = useCallback((): void => {
    void chrome.tabs.create({ url: `${WEB_BASE_URL}/library` });
  }, []);

  const activePresence = activity?.slug ? presences[activity.slug] : null;
  const isSnoozed = Boolean(activePresence?.snoozeUntil && activePresence.snoozeUntil > Date.now());

  const handleUnsnooze = useCallback((): void => {
    if (!activity?.slug) return;
    void sendMessage("CLEAR_SNOOZE", { slug: activity.slug });
  }, [activity?.slug]);

  const handleScheduleOpen = useCallback((slug: string | null) => {
    setScheduleSlug(slug);
    setScheduleOpen(true);
  }, []);

  const handleViewChange = useCallback((view: AppView): void => {
    setSelectedPresenceSlug(null);
    setActiveView(view);
    persistAppView(view);
  }, []);

  useEffect(() => {
    if (!developerModeEnabled && activeView === "logs") {
      setActiveView("home");
      persistAppView("home");
    }
  }, [activeView, developerModeEnabled]);

  const connectionHealthy = isConnectionHealthy(liveNativeStatus);
  const displayMode = settings.presenceDisplayMode === "grid" ? "grid" : "category";
  const showLayoutToggle = activeView === "home" && !selectedPresenceSlug;

  useEffect(() => {
    setStatusVisible(true);
    if (!connectionHealthy) return;
    const timer = window.setTimeout(() => setStatusVisible(false), 2500);
    return () => window.clearTimeout(timer);
  }, [connectionHealthy]);

  return (
    <main data-theme={settings.theme ?? "default"} className="sidepanel-shell relative bg-background text-foreground">
      {settings.backgroundAnimation !== false ? <div className="sidepanel-bg" aria-hidden /> : null}
      <div className="sidepanel-chrome relative z-1">
      <div className="sidepanel-body">
        <div className="sidepanel-topbar">
          <Header
            displayMode={showLayoutToggle ? displayMode : undefined}
            isCheckingUpdates={isCheckingUpdates}
            onCheckUpdates={checkUpdates}
            onDisplayModeChange={showLayoutToggle ? (mode) => setSettings({ presenceDisplayMode: mode }) : undefined}
            onOpenLibrary={onOpenLibrary}
            onReplayOnboarding={resetOnboardingForDev}
            supporter={supporterStatus.adFree}
          />
        </div>

        <div
          id="sidepanel-tabpanel"
          role="tabpanel"
          aria-labelledby={`sidepanel-tab-${activeView}`}
          className={`sidepanel-scroll${activeView === "home" ? " sidepanel-scroll-plain" : ""}`}
        >
          {activeView === "home" ? (
            <div className="flex flex-col gap-4">
              {settings.showPlayer !== false && !selectedPresenceSlug ? (
                <CurrentActivityCard
                  activity={activity}
                  isLoading={isLoading}
                  isSnoozed={isSnoozed}
                  onSnooze={() => setSnoozeOpen(true)}
                  onUnsnooze={handleUnsnooze}
                  presences={presences}
                />
              ) : null}
              <ActivityView
                activity={activity}
                entries={entries}
                isLoading={isLoading}
                onOpenMarketplace={onOpenMarketplace}
                onRemove={removePresence}
                onSchedule={handleScheduleOpen}
                onSelectPresence={setSelectedPresenceSlug}
                onToggle={togglePresence}
                selectedSlug={selectedPresenceSlug}
                settings={settings}
                updates={updates}
              />
            </div>
          ) : activeView === "logs" && developerModeEnabled ? (
            <AnalyticsLogsView />
          ) : (
            <SettingsView
              adFree={supporterStatus.adFree}
              debug={debug}
              hostVersionInfo={hostVersionInfo}
              isCheckingHostVersion={isCheckingHostVersion}
              isCheckingUpdates={isCheckingUpdates}
              isLoading={isLoading}
              localePreference={localePreference}
              nativeStatus={liveNativeStatus}
              onCheckHostUpdate={checkHostUpdate}
              onCheckUpdates={checkUpdates}
              onForceShowOnboarding={resetOnboardingForDev}
              onLocaleChange={setLocalePreference}
              onScheduleGlobal={() => handleScheduleOpen(null)}
              settings={settings}
              onSettingsChange={setSettings}
            />
          )}
        </div>
      </div>

      <ConnectionStatusBar nativeStatus={liveNativeStatus} onConnect={connectNative} visible={statusVisible} />

      <BottomNav
        activeView={activeView}
        onViewChange={handleViewChange}
        showLogs={developerModeEnabled}
      />
      </div>

      <SnoozeDialog
        activeSlug={activity?.slug ?? null}
        onClose={() => setSnoozeOpen(false)}
        open={snoozeOpen}
        presences={presences}
      />

      <ScheduleDialog
        activeSlug={scheduleSlug}
        globalSchedule={settings.globalSchedule}
        onClose={() => setScheduleOpen(false)}
        open={scheduleOpen}
        presences={presences}
      />

      <OnboardingOverlay
        activity={activity}
        nativeStatus={liveNativeStatus}
        presences={presences}
        userScripts={userScripts}
        devReplayOnboarding={onboarding.devReplayOnboarding}
        onboardingCompleted={onboarding.onboardingCompleted}
        localePreference={localePreference}
        onLocaleChange={setLocalePreference}
        onConnectNative={() => {
          connectNative();
        }}
        onComplete={() => setOnboarding({ devReplayOnboarding: false, onboardingCompleted: true })}
        onSkipTour={() => setOnboarding({ devReplayOnboarding: false, onboardingCompleted: true })}
        settings={settings}
        onSettingsChange={setSettings}
        supporter={supporterStatus.adFree}
      />

      <SupporterThankYouOverlay
        status={supporterStatus}
        onClose={dismissSupporterThankYou}
      />
    </main>
  );
};

export default App;
