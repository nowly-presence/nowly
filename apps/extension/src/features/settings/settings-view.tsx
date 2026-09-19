import { LocaleFlag } from "@/components/shared/locale-flag";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { DebugPanel } from "@/features/settings/debug-panel";
import { SettingsGroup } from "@/features/settings/settings-group";
import { ShortcutSettings } from "@/features/settings/shortcut-settings";
import { ThemeSelector } from "@/features/settings/theme-selector";
import type { NativeStatus } from "@/lib/messages";
import { IconArrowsSort, IconCalendar, IconChevronDown, IconChevronUp, IconDeviceDesktop, IconExternalLink, IconMoon, IconRefresh, IconSun, IconWorld } from "@/lib/tabler-icons";
import { HOST_DOWNLOAD_URL, WEB_BASE_URL } from "@/shared/constants";
import { t, type LocalePreference } from "@/shared/i18n";
import type { ExtensionSettings, InstalledPresences, PresenceDebug } from "@/shared/types";
import type { FC, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

type HostVersionInfo = {
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
};

type Props = {
  debug: PresenceDebug | null;
  hostVersionInfo: HostVersionInfo | null;
  isCheckingHostVersion: boolean;
  isCheckingUpdates: boolean;
  isLoading: boolean;
  localePreference: LocalePreference;
  nativeStatus: NativeStatus;
  onCheckHostUpdate: () => Promise<void>;
  onCheckUpdates: () => void;
  onForceShowOnboarding: () => Promise<void>;
  onLocaleChange: (preference: LocalePreference) => void;
  onScheduleGlobal: () => void;
  presences: InstalledPresences;
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
  analyticsConsent: boolean;
  onAnalyticsConsentChange: (granted: boolean) => void;
};

type SettingsGroupId = "general" | "presences" | "advanced";

const CHECK_RATE_LIMIT_MS = 30_000;
const hostUpdateActionClassName = "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors sm:flex-1";
const innerClassName = "px-4 py-4";
const sectionTitleClassName = "mb-2 text-xs font-semibold text-muted-foreground";

export const SettingsView: FC<Props> = ({
  debug,
  hostVersionInfo,
  isCheckingHostVersion,
  isCheckingUpdates,
  isLoading,
  localePreference,
  nativeStatus,
  onCheckHostUpdate,
  onCheckUpdates,
  onForceShowOnboarding,
  onLocaleChange,
  onScheduleGlobal,
  presences,
  settings,
  onSettingsChange,
  analyticsConsent,
  onAnalyticsConsentChange,
}): ReactElement => {
  const [isUnpacked, setIsUnpacked] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<SettingsGroupId, boolean>>({
    general: true,
    presences: false,
    advanced: settings.developerMode === true,
  });

  const lastCheckRef = useRef(0);
  const localeOptions = [
    { icon: <IconWorld className="size-4 text-muted-foreground" />, label: t("locale-auto"), value: "browser" as const },
    { icon: <LocaleFlag locale="fr-FR" />, label: t("locale-fr"), value: "fr" as const },
    { icon: <LocaleFlag locale="en-US" />, label: t("locale-en"), value: "en" as const },
    { icon: <LocaleFlag locale="es-ES" />, label: t("locale-es"), value: "es" as const },
  ];

  const appearanceOptions = [
    { icon: <IconDeviceDesktop className="size-4 text-muted-foreground" />, label: t("appearance-system"), value: "system" as const },
    { icon: <IconSun className="size-4 text-muted-foreground" />, label: t("appearance-light"), value: "light" as const },
    { icon: <IconMoon className="size-4 text-muted-foreground" />, label: t("appearance-dark"), value: "dark" as const },
  ];

  const presenceLanguageOptions = [
    { icon: <IconWorld className="size-4 text-muted-foreground" />, label: t("presence-language-per-presence"), value: "per-presence" as const },
    { icon: <LocaleFlag locale="en-US" />, label: t("locale-en"), value: "en-US" as const },
    { icon: <LocaleFlag locale="fr-FR" />, label: t("locale-fr"), value: "fr-FR" as const },
    { icon: <LocaleFlag locale="es-ES" />, label: t("locale-es"), value: "es-ES" as const },
  ];

  const activitySelectionModeOptions = [
    { icon: <IconArrowsSort className="size-4 text-muted-foreground" />, label: t("activity-selection-mode-focused"), value: "focused" as const },
    { icon: <IconArrowsSort className="size-4 text-muted-foreground" />, label: t("activity-selection-mode-priority"), value: "priority" as const },
  ];

  const installedSlugs = Object.keys(presences);
  const priorityOrder = [
    ...(settings.activityPriorityOrder ?? []).filter((slug) => installedSlugs.includes(slug)),
    ...installedSlugs.filter((slug) => !(settings.activityPriorityOrder ?? []).includes(slug)),
  ];
  const movePriority = (slug: string, direction: -1 | 1): void => {
    const index = priorityOrder.indexOf(slug);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= priorityOrder.length) return;
    const reordered = [...priorityOrder];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    onSettingsChange({ activityPriorityOrder: reordered });
  };

  useEffect(() => {
    try { setIsUnpacked(!chrome.runtime.getManifest().update_url) } catch { setIsUnpacked(false) }
  }, []);

  const developerModeEnabled = settings.developerMode ?? isUnpacked;
  const canaryEnabled = settings.canaryTheme ?? import.meta.env.VITE_NOWLY_CHANNEL === "canary";

  const toggleGroup = (id: SettingsGroupId): void => {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  };

  const handleCheckUpdates = (): void => {
    const now = Date.now();
    if (now - lastCheckRef.current < CHECK_RATE_LIMIT_MS) return;
    lastCheckRef.current = now;
    onCheckUpdates();
  };

  if (isLoading) {
    return (
      <section className="flex flex-col gap-3">
        <section className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/4" />
          <Skeleton className="mb-3 h-3 w-3/5" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </section>
        <section className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/5" />
          <Skeleton className="mb-3 h-3 w-2/5" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </section>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      {hostVersionInfo?.updateAvailable ? (
        <section className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <h2 className="mb-2 text-xs font-semibold text-accent">
            {t("host-update-available", { latestVersion: hostVersionInfo.latestVersion })}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={HOST_DOWNLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className={`${hostUpdateActionClassName} border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20`}
            >
              {t("host-download-update")}
              <IconExternalLink className="size-3.5" />
            </a>
            <Button
              variant="unstyled"
              size="none"
              onClick={() => { void onCheckHostUpdate(); }}
              disabled={isCheckingHostVersion}
              className={`${hostUpdateActionClassName} border border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <IconRefresh className={`size-3.5 ${isCheckingHostVersion ? "animate-spin" : ""}`} />
              {t("host-check-update")}
            </Button>
          </div>
        </section>
      ) : null}

      <SettingsGroup
        id="general"
        open={openGroups.general}
        onToggle={() => toggleGroup("general")}
        title={t("settings-group-general")}
      >
        <section className={innerClassName}>
          <h2 className={sectionTitleClassName}>{t("language")}</h2>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("language-description")}</p>
          <CustomSelect
            aria-label={t("language")}
            className="h-10"
            onChange={onLocaleChange}
            options={localeOptions}
            value={localePreference}
          />
        </section>

        <section className={innerClassName}>
          <h2 className={sectionTitleClassName}>{t("appearance")}</h2>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("appearance-description")}</p>
          <CustomSelect
            aria-label={t("appearance")}
            className="h-10"
            onChange={(value) => onSettingsChange({ appearance: value })}
            options={appearanceOptions}
            value={settings.appearance ?? "system"}
          />
        </section>

        <div className={innerClassName}>
          <ThemeSelector settings={settings} onSettingsChange={onSettingsChange} canary={canaryEnabled} />
        </div>

        <section className={innerClassName}>
          <Label unstyled className="flex cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("presence-pause")}</span>
              <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{t("presence-pause-description")}</span>
            </span>
            <Switch
              checked={settings.presencePaused === true}
              onChange={(checked) => onSettingsChange({ presencePaused: checked })}
            />
          </Label>
        </section>

        <section className={innerClassName}>
          <ShortcutSettings />
        </section>

        <section className={innerClassName}>
          <Label unstyled className="flex cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("bg-animation")}</span>
              <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{t("bg-animation-description")}</span>
            </span>
            <Switch
              checked={settings.backgroundAnimation !== false}
              onChange={(checked) => onSettingsChange({ backgroundAnimation: checked })}
            />
          </Label>
        </section>

        <section className={innerClassName}>
          <Label unstyled className="flex cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("analytics-consent")}</span>
              <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{t("analytics-consent-description")}</span>
            </span>
            <Switch
              checked={analyticsConsent}
              onChange={onAnalyticsConsentChange}
            />
          </Label>
          <a
            href={`${WEB_BASE_URL.replace(/\/$/, "")}/consent`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            {t("analytics-consent-manage")}
            <IconExternalLink className="size-3" />
          </a>
        </section>
      </SettingsGroup>

      <SettingsGroup
        id="presences"
        open={openGroups.presences}
        onToggle={() => toggleGroup("presences")}
        title={t("settings-group-presences")}
      >
        <section className={innerClassName}>
          <h2 className={sectionTitleClassName}>{t("presence-language")}</h2>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("presence-language-description")}</p>
          <CustomSelect
            aria-label={t("presence-language")}
            className="h-10"
            onChange={(value) => onSettingsChange({ presenceLanguage: value })}
            options={presenceLanguageOptions}
            value={settings.presenceLanguage ?? "per-presence"}
          />
        </section>

        <section className={innerClassName}>
          <Label unstyled className="flex cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("schedule-feature")}</span>
              <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{t("schedule-feature-description")}</span>
            </span>
            <Switch
              checked={settings.scheduleEnabled === true}
              onChange={(checked) => onSettingsChange({ scheduleEnabled: checked })}
            />
          </Label>
          {settings.scheduleEnabled === true ? (
            <Button
              variant="unstyled"
              size="none"
              onClick={onScheduleGlobal}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-card-2 px-3 text-xs font-medium text-foreground transition-colors hover:bg-card-hover"
            >
              <IconCalendar className="size-3.5" />
              {t("schedule-edit-global")}
            </Button>
          ) : null}
        </section>

        <section className={innerClassName}>
          <h2 className={sectionTitleClassName}>{t("activity-selection-mode")}</h2>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("activity-selection-mode-description")}</p>
          <CustomSelect
            aria-label={t("activity-selection-mode")}
            className="h-10"
            onChange={(value) => onSettingsChange({ activitySelectionMode: value })}
            options={activitySelectionModeOptions}
            value={settings.activitySelectionMode ?? "focused"}
          />
          {settings.activitySelectionMode === "priority" && installedSlugs.length > 0 ? (
            <div className="mt-3">
              <p className="mb-2 text-xs leading-5 text-muted-foreground">{t("activity-priority-order-description")}</p>
              <ul className="flex flex-col gap-1.5">
                {priorityOrder.map((slug, index) => (
                  <li
                    key={slug}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card-2 px-3 py-2 text-sm text-foreground"
                  >
                    <span className="min-w-0 truncate">{presences[slug]?.metadata.name ?? slug}</span>
                    <span className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("activity-priority-move-up")}
                        disabled={index === 0}
                        onClick={() => movePriority(slug, -1)}
                      >
                        <IconChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("activity-priority-move-down")}
                        disabled={index === priorityOrder.length - 1}
                        onClick={() => movePriority(slug, 1)}
                      >
                        <IconChevronDown className="size-4" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </SettingsGroup>

      <SettingsGroup
        id="advanced"
        open={openGroups.advanced}
        onToggle={() => toggleGroup("advanced")}
        title={t("settings-group-advanced")}
      >
        <section className={innerClassName}>
          <Label unstyled className="flex cursor-pointer items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{t("developer-mode")}</span>
              <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{t("developer-mode-description")}</span>
            </span>
            <Switch
              checked={developerModeEnabled}
              onChange={(checked) => {
                onSettingsChange({ developerMode: checked });
                if (checked) setOpenGroups((current) => ({ ...current, advanced: true }));
              }}
            />
          </Label>
        </section>

        {isUnpacked ? (
          <section className={innerClassName}>
            <Label unstyled className="flex cursor-pointer items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{t("canary-theme")}</span>
                <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">{t("canary-theme-description")}</span>
              </span>
              <Switch
                checked={canaryEnabled}
                onChange={(checked) => onSettingsChange({ canaryTheme: checked })}
              />
            </Label>
          </section>
        ) : null}

        <section className={innerClassName}>
          <h2 className={sectionTitleClassName}>{t("check-updates")}</h2>
          <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("check-updates-description")}</p>
          <Button
            variant="unstyled"
            size="none"
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card-2 px-3 text-sm font-medium text-foreground transition-colors hover:bg-card-hover disabled:opacity-50"
          >
            <IconRefresh className={`size-4 ${isCheckingUpdates ? "animate-spin" : ""}`} />
            {t("check-updates")}
          </Button>
        </section>

        {developerModeEnabled ? (
          <div className={innerClassName}>
            <DebugPanel
              debug={debug}
              nativeStatus={nativeStatus}
              onForceShowOnboarding={onForceShowOnboarding}
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        ) : null}
      </SettingsGroup>
    </section>
  );
};
