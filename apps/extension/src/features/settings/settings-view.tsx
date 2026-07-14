import { LocaleFlag } from "@/components/shared/locale-flag";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { NativeStatus } from "@/lib/messages";
import { WEB_BASE_URL } from "@/shared/constants";
import { resolveLocale, t, type LocalePreference } from "@/shared/i18n";
import type { ExtensionSettings, PresenceDebug, PresenceLanguageMode } from "@/shared/types";
import { IconChevronDown, IconExternalLink, IconRefresh } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";
import { DebugPanel } from "@/features/settings/debug-panel";
import { DisplaySettings } from "@/features/settings/display-settings";
import { ThemeSelector } from "@/features/settings/theme-selector";
import { ThemeUpsellCard } from "@/features/settings/theme-upsell-card";

type HostVersionInfo = {
  currentVersion?: string;
  latestVersion: string;
  updateAvailable: boolean;
};

type Props = {
  adFree: boolean;
  debug: PresenceDebug | null;
  hostVersionInfo: HostVersionInfo | null;
  isCheckingHostVersion: boolean;
  isLoading: boolean;
  localePreference: LocalePreference;
  nativeStatus: NativeStatus;
  onCheckHostUpdate: () => Promise<void>;
  onForceShowOnboarding: () => Promise<void>;
  onLocaleChange: (preference: LocalePreference) => void;
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

const hostUpdateActionClassName = "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors sm:flex-1";

export const SettingsView: FC<Props> = ({
  adFree,
  debug,
  hostVersionInfo,
  isCheckingHostVersion,
  isLoading,
  localePreference,
  nativeStatus,
  onCheckHostUpdate,
  onForceShowOnboarding,
  onLocaleChange,
  settings,
  onSettingsChange,
}): ReactElement => {
  const [isUnpacked, setIsUnpacked] = useState(false);
  const consentUrl = `${WEB_BASE_URL}/consent`;
  const localeOptions: Array<{ label: string; value: LocalePreference }> = [
    { label: t("locale-auto"), value: "browser" },
    { label: t("locale-fr"), value: "fr" },
    { label: t("locale-en"), value: "en" },
    { label: t("locale-es"), value: "es" },
  ];

  useEffect(() => {
    try { setIsUnpacked(!chrome.runtime.getManifest().update_url) } catch { setIsUnpacked(false) }
  }, []);

  const developerModeEnabled = settings.developerMode ?? isUnpacked;

  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/4" />
          <Skeleton className="mb-3 h-3 w-3/5" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/5" />
          <Skeleton className="mb-3 h-3 w-2/5" />
          <Skeleton className="h-10 w-full" rounded="lg" />
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/5" />
          <Skeleton className="mb-3 h-3 w-3/5" />
          <Skeleton className="h-8 w-full" rounded="lg" />
        </section>
        <section className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="mb-2 h-3 w-1/4" />
          <Skeleton className="mb-3 h-3 w-3/5" />
          <Skeleton className="h-8 w-full" rounded="lg" />
        </section>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {hostVersionInfo?.updateAvailable ? (
        <section className="rounded-lg border border-accent/20 bg-accent/5 p-4">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-accent">
            {t("host-update-available", { latestVersion: hostVersionInfo.latestVersion })}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="https://nowly.me/host"
              target="_blank"
              rel="noreferrer"
              className={`${hostUpdateActionClassName} border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20`}
            >
              {t("host-download-update")}
              <IconExternalLink className="h-3.5 w-3.5" />
            </a>
            <Button
              variant="unstyled"
              size="none"
              onClick={() => { void onCheckHostUpdate(); }}
              disabled={isCheckingHostVersion}
              className={`${hostUpdateActionClassName} border border-border bg-card-2 text-muted-foreground hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <IconRefresh className={`h-3.5 w-3.5 ${isCheckingHostVersion ? "animate-spin" : ""}`} />
              {t("host-check-update")}
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("language")}</h2>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("language-description")}</p>
        <div className="relative">
          <Select
            unstyled
            value={localePreference}
            onChange={(event) => onLocaleChange(event.target.value as LocalePreference)}
            className="h-10 w-full appearance-none rounded-lg border border-border bg-card-2 px-3 pl-10 pr-10 text-sm text-foreground outline-none transition-colors hover:bg-card-hover focus:border-border-light"
          >
            {localeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            <LocaleFlag locale={resolveLocale(localePreference)} />
          </div>
          <IconChevronDown className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
        </div>
      </section>

      <DisplaySettings settings={settings} onSettingsChange={onSettingsChange} />

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("presence-language")}</h2>
        <p className="mb-3 text-xs leading-5 text-muted-foreground">{t("presence-language-description")}</p>
        <Select
          unstyled
          value={settings.presenceLanguage ?? "per-presence"}
          onChange={(event) => onSettingsChange({ presenceLanguage: event.target.value as PresenceLanguageMode })}
          className="h-10 w-full rounded-lg border border-border bg-card-2 px-3 text-sm text-foreground outline-none transition-colors focus:border-border-light"
        >
          <option value="per-presence">{t("presence-language-per-presence")}</option>
          <option value="en-US">{t("locale-en")}</option>
          <option value="fr-FR">{t("locale-fr")}</option>
          <option value="es-ES">{t("locale-es")}</option>
        </Select>
      </section>

      {adFree ? (
        <ThemeSelector settings={settings} onSettingsChange={onSettingsChange} />
      ) : (
        <ThemeUpsellCard />
      )}

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("features")}</h2>
        <div className="grid gap-2">
          <Label unstyled className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card-2 px-3 py-2">
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">{t("schedule-feature")}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{t("schedule-feature-description")}</span>
            </span>
            <Switch
              checked={settings.scheduleEnabled !== false}
              onChange={(checked) => onSettingsChange({ scheduleEnabled: checked })}
            />
          </Label>
          <Label unstyled className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card-2 px-3 py-2">
            <span className="min-w-0">
              <span className="block text-xs font-medium text-foreground">{t("developer-mode")}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{t("developer-mode-description")}</span>
            </span>
            <Switch
              checked={developerModeEnabled}
              onChange={(checked) => onSettingsChange({ developerMode: checked })}
            />
          </Label>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <Label unstyled className="flex cursor-pointer items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("data-management")}</span>
            <span className="mt-2 block text-xs font-medium text-foreground">{t("analytics-consent")}</span>
            <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{t("analytics-description")}</span>
          </span>
          <Checkbox
            ariaLabel={t("analytics-consent")}
            checked={settings.analyticsConsent === true}
            onChange={(checked) => onSettingsChange({ analyticsConsent: checked })}
          />
        </Label>

        <a
          href={consentUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card-2 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
        >
          {t("data-management")}
          <IconExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      {developerModeEnabled ? (
        <DebugPanel
          debug={debug}
          nativeStatus={nativeStatus}
          onForceShowOnboarding={onForceShowOnboarding}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      ) : null}
    </section>
  );
};
