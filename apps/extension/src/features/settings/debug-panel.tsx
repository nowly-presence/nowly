import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRelativeTime } from "@/lib/format";
import type { NativeStatus } from "@/lib/messages";
import { API_BASE_URL } from "@/shared/constants";
import { t } from "@/shared/i18n";
import type { ExtensionSettings, PresenceDebug } from "@/shared/types";
import { IconChevronDown, IconRotateClockwise2, IconTerminal } from "@tabler/icons-react";
import type { FC, ReactElement } from "react";
import { useEffect, useState } from "react";

type Props = {
  debug: PresenceDebug | null;
  nativeStatus: NativeStatus;
  onForceShowOnboarding: () => Promise<void>;
  settings: ExtensionSettings;
  onSettingsChange: (partial: Partial<ExtensionSettings>) => void;
};

export const DebugPanel: FC<Props> = ({ debug, nativeStatus, onForceShowOnboarding, settings, onSettingsChange }): ReactElement => {
  const [open, setOpen] = useState(false);
  const hasNativeIssue = !nativeStatus.connected || !nativeStatus.discordConnected;
  const nativeIssueMessage = !nativeStatus.connected
    ? t("diagnostic-host-missing-message")
    : !nativeStatus.discordConnected
      ? t("diagnostic-discord-closed-message")
      : nativeStatus.status;
  const updatedAt = formatRelativeTime(debug?.updatedAt);
  const [apiUrl, setApiUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setApiUrl(settings.customApiBaseUrl ?? API_BASE_URL);
  }, [settings.customApiBaseUrl]);

  const handleSave = (): void => {
    const trimmed = apiUrl.trim()
    onSettingsChange({ customApiBaseUrl: trimmed !== API_BASE_URL ? trimmed : undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = (): void => {
    setApiUrl(API_BASE_URL);
    onSettingsChange({ customApiBaseUrl: undefined });
  };

  return (
    <section className="mt-auto rounded-lg border border-border bg-card">
      <Button
        variant="unstyled"
        size="none"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconTerminal className="h-3.5 w-3.5" />
        <span className="min-w-0 flex-1 font-semibold text-foreground">{t("debug")}</span>
        <IconChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <div className="border-t border-border px-3 py-2.5 text-[11px] leading-5 text-muted-foreground">
          {debug ? (
            <p className="wrap-break-words">
              <span className="font-semibold text-foreground">{debug.stage}</span>
              {" - "}
              {debug.message}
              {updatedAt ? <span className="text-dim-foreground"> - {updatedAt}</span> : null}
            </p>
          ) : (
            <p className="text-dim-foreground">{t("debug-idle")}</p>
          )}

          {hasNativeIssue && (
            <p className="mt-1 wrap-break-words">
              <span className="font-semibold text-foreground">{t("debug-native-label")}</span>
              {" - "}
              {nativeIssueMessage}
            </p>
          )}

          <div className="mt-3 border-t border-border pt-3">
            <p className="font-semibold text-foreground">{t("developer-onboarding-reset-title")}</p>

            <p className="mb-2 text-[10px] leading-4 text-dim-foreground">
              {t("developer-onboarding-reset-description")}
            </p>

            <Button
              variant="unstyled"
              size="none"
              onClick={() => {
                void onForceShowOnboarding();
              }}
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card-2 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
            >
              <IconRotateClockwise2 className="h-3.5 w-3.5" />
              {t("developer-onboarding-reset-action")}
            </Button>
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <Label unstyled className="text-[11px] font-medium text-dim-foreground">
              {t("api-base-url")}
            </Label>

            <p className="mb-1.5 text-[10px] leading-4 text-dim-foreground">
              {t("api-base-url-description")}
            </p>

            <div className="flex gap-1.5">
              <Input
                unstyled
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder={API_BASE_URL}
                className="min-w-0 flex-1 rounded-lg border border-border bg-card-2 px-2.5 py-1.5 text-[11px] text-foreground outline-none transition-colors placeholder:text-dim-foreground focus:border-border-light"
              />

              <Button
                variant="unstyled"
                size="none"
                onClick={handleSave}
                className="shrink-0 rounded-lg border border-border bg-card-2 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
              >
                {saved ? (
                  <span className="text-success">OK</span>
                ) : (
                  t("save")
                )}
              </Button>

              {apiUrl.trim() && (
                <Button
                  variant="unstyled"
                  size="none"
                  onClick={handleReset}
                  className="shrink-0 rounded-lg border border-border bg-card-2 px-2.5 text-[11px] text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
                  title={t("reset")}
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};