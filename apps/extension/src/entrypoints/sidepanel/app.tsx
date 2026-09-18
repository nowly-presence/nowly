import { BottomNav, type AppView } from "@/components/layout/bottom-nav";
import { ConnectionStatusBar, isConnectionHealthy } from "@/components/layout/connection-status-bar";
import { Header } from "@/components/layout/header";
import { RuntimeLogsView } from "@/features/runtime-logs/runtime-logs-view";
import { OnboardingOverlay } from "@/features/onboarding/onboarding-overlay";
import { ActivityView } from "@/features/presences/activity-view";
import { CurrentActivityCard } from "@/features/presences/current-activity-card";
import { ScheduleDialog } from "@/features/presences/schedule-dialog";
import { SnoozeDialog } from "@/features/presences/snooze-dialog";
import { InstallQueueBanner } from "@/features/store/install-queue-banner";
import { StoreView } from "@/features/store/store-view";
import { SettingsView } from "@/features/settings/settings-view";
import { useAppearance } from "@/hooks/use-appearance";
import { useExtensionState } from "@/hooks/use-extension-state";
import { useLocalePreference } from "@/hooks/use-locale-preference";
import { useOnboardingState } from "@/hooks/use-onboarding-state";
import { trackUiEvent } from "@/lib/analytics";
import { sendMessage } from "@/lib/messages";
import { HOST_DOWNLOAD_URL, WEB_BASE_URL } from "@/shared/constants";
import { t } from "@/shared/i18n";
import {
  SIDEPANEL_NAV_KEY,
  clearPendingSidepanelNav,
  isSidepanelPendingNav,
  loadPendingSidepanelNav,
  persistAppView,
  type SidepanelPendingNav,
} from "@/shared/sidepanel-view";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  initialView: AppView;
};

const App: FC<Props> = ({ initialView }): ReactElement => {
  const {
    activity,
    checkHostUpdate,
    checkUpdates,
    connectNative,
    debug,
    entries,
    hostVersionInfo,
    installQueue,
    isCheckingHostVersion,
    isCheckingUpdates,
    isLoading,
    isUnpacked,
    nativeStatus,
    presences,
    installPresenceFromApi,
    removePresence,
    resetOnboardingForDev,
    retryInstallQueue,
    setPresencePaused,
    togglePresence,
    updates,
    settings,
    setSettings,
    analyticsConsent,
    setAnalyticsConsent,
  } = useExtensionState();
  useAppearance(settings.appearance ?? "system");
  useEffect(() => {
    trackUiEvent("extension_open", { payload: { surface: "sidepanel" } });
  }, []);
  useEffect(() => {
    // Dev-only: let an unpacked build toggle the Canary accent to preview the
    // global (stable) look. Store builds keep their compiled channel.
    if (!isUnpacked) return;
    const canary = settings.canaryTheme ?? import.meta.env.VITE_NOWLY_CHANNEL === "canary";
    const root = document.documentElement;
    if (canary) root.dataset.channel = "canary";
    else delete root.dataset.channel;
  }, [isUnpacked, settings.canaryTheme]);
  const { localePreference, setLocalePreference } = useLocalePreference();
  const onSettingsLocaleChange = (locale: Parameters<typeof setLocalePreference>[0]) => {
    trackUiEvent("settings_language_changed");
    setLocalePreference(locale);
  };
  const { onboarding, setOnboarding, nativeStatus: onboardingNativeStatus, userScripts } = useOnboardingState();
  const [activeView, setActiveView] = useState<AppView>(initialView);
  const [selectedPresenceSlug, setSelectedPresenceSlug] = useState<string | null>(null);
  const [storeSeed, setStoreSeed] = useState<{ query: string; slug: string | null }>({ query: "", slug: null });
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleSlug, setScheduleSlug] = useState<string | null>(null);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [installError, setInstallError] = useState(false);
  const [installQueued, setInstallQueued] = useState(false);
  const liveNativeStatus = onboardingNativeStatus.status === "unknown" && nativeStatus.status !== "unknown"
    ? nativeStatus
    : onboardingNativeStatus;
  const developerModeEnabled = settings.developerMode ?? isUnpacked;
  const presencePaused = settings.presencePaused === true;

  const [statusVisible, setStatusVisible] = useState(true);

  const applyPendingNav = useCallback((nav: SidepanelPendingNav): void => {
    setInstallError(false);
    setInstallQueued(false);
    if (nav.view === "home") {
      setActiveView("home");
      setSelectedPresenceSlug(nav.slug ?? null);
      persistAppView("home");
      return;
    }
    if (nav.view === "store") {
      setActiveView("store");
      setSelectedPresenceSlug(null);
      setStoreSeed({ query: nav.query ?? "", slug: nav.slug ?? null });
      persistAppView("store");
      return;
    }
    setActiveView(nav.view);
    persistAppView(nav.view);
  }, []);

  useEffect(() => {
    void loadPendingSidepanelNav().then((nav) => {
      if (!nav) return;
      applyPendingNav(nav);
      void clearPendingSidepanelNav();
    });

    const onStorageChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== "local" || !changes[SIDEPANEL_NAV_KEY]) return;
      const nav = changes[SIDEPANEL_NAV_KEY].newValue;
      if (!isSidepanelPendingNav(nav)) return;
      applyPendingNav(nav);
      void clearPendingSidepanelNav();
    };
    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => chrome.storage.onChanged.removeListener(onStorageChanged);
  }, [applyPendingNav]);

  const onOpenWebsite = useCallback((slug: string): void => {
    void chrome.tabs.create({ url: `${WEB_BASE_URL}/library/${slug}` });
  }, []);

  const handleInstallFromApi = useCallback(async (slug: string): Promise<void> => {
    setInstallError(false);
    setInstallQueued(false);
    setInstallingSlug(slug);
    const result = await installPresenceFromApi(slug);
    setInstallingSlug(null);
    if (result.ok) {
      return;
    }
    if (result.queued) {
      setInstallQueued(true);
      return;
    }
    setInstallError(true);
  }, [installPresenceFromApi]);

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
    setInstallError(false);
    setInstallQueued(false);
    setStoreSeed({ query: "", slug: null });
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
    if (presencePaused) return;
    if (hostVersionInfo?.updateAvailable) return;
    if (!connectionHealthy) return;
    const timer = window.setTimeout(() => setStatusVisible(false), 2500);
    return () => window.clearTimeout(timer);
  }, [connectionHealthy, hostVersionInfo?.updateAvailable, presencePaused]);

  const queueBanner = (
    <InstallQueueBanner count={installQueue.length} onRetry={() => void retryInstallQueue()} />
  );

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
            onReplayOnboarding={resetOnboardingForDev}
            onTogglePause={() => setPresencePaused(!presencePaused)}
            presencePaused={presencePaused}
          />
        </div>

        <div
          id="sidepanel-tabpanel"
          role="tabpanel"
          aria-labelledby={`sidepanel-tab-${activeView}`}
          className={`sidepanel-scroll${activeView === "home" || activeView === "store" ? " sidepanel-scroll-plain" : ""}`}
        >
          {activeView === "home" ? (
            <div className="flex flex-col gap-4">
              {queueBanner}
              {installError ? (
                <p className="text-xs text-red-400">{t("store-install-error")}</p>
              ) : null}
              {installQueued ? (
                <p className="text-xs text-amber-300">{t("store-install-queued")}</p>
              ) : null}
              {settings.showPlayer !== false && !selectedPresenceSlug ? (
                <CurrentActivityCard
                  activity={activity}
                  idleHint={
                    !activity && settings.scheduleEnabled === true && (
                      Boolean(settings.globalSchedule)
                      || Object.values(presences).some((presence) => Boolean(presence.schedule))
                    )
                      ? t("schedule-idle-hint")
                      : undefined
                  }
                  isLoading={isLoading}
                  isPaused={presencePaused}
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
                onOpenWebsite={onOpenWebsite}
                onRemove={removePresence}
                onSchedule={handleScheduleOpen}
                onSelectPresence={setSelectedPresenceSlug}
                onToggle={togglePresence}
                onUpdatePresence={(slug) => void handleInstallFromApi(slug)}
                selectedSlug={selectedPresenceSlug}
                settings={settings}
                updates={updates}
                updatingSlug={installingSlug}
              />
            </div>
          ) : activeView === "store" ? (
            <div className="flex flex-col gap-3">
              {queueBanner}
              {installError ? (
                <p className="text-xs text-red-400">{t("store-install-error")}</p>
              ) : null}
              {installQueued ? (
                <p className="text-xs text-amber-300">{t("store-install-queued")}</p>
              ) : null}
              <StoreView
                installingSlug={installingSlug}
                onInstall={(slug) => void handleInstallFromApi(slug)}
                presences={presences}
                seedQuery={storeSeed.query}
                seedSlug={storeSeed.slug}
                updates={updates}
              />
            </div>
          ) : activeView === "logs" && developerModeEnabled ? (
            <RuntimeLogsView />
          ) : (
            <SettingsView
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
              onLocaleChange={onSettingsLocaleChange}
              onScheduleGlobal={() => handleScheduleOpen(null)}
              settings={settings}
              onSettingsChange={setSettings}
              analyticsConsent={analyticsConsent}
              onAnalyticsConsentChange={setAnalyticsConsent}
            />
          )}
        </div>
      </div>

      <ConnectionStatusBar
        nativeStatus={liveNativeStatus}
        onConnect={() => {
          if (hostVersionInfo?.updateAvailable && liveNativeStatus.connected) {
            void chrome.tabs.create({ url: HOST_DOWNLOAD_URL });
            return;
          }
          connectNative();
        }}
        presencePaused={presencePaused}
        hostUpdateAvailable={hostVersionInfo?.updateAvailable === true}
        visible={statusVisible}
      />

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
        onComplete={() => {
          setOnboarding({ devReplayOnboarding: false, onboardingCompleted: true });
        }}
        onSkipTour={() => {
          trackUiEvent("onboarding_skipped", { source: "extension_onboarding" });
          setOnboarding({ devReplayOnboarding: false, onboardingCompleted: true });
        }}
        settings={settings}
        onSettingsChange={setSettings}
        hostVersionInfo={hostVersionInfo}
      />
    </main>
  );
};

export default App;
