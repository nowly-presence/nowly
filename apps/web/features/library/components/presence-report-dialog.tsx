"use client";

import { DISCORD_INVITE_URL } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import { ButtonAnchor } from "@nowly/ui/button-link";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, FieldError, FieldLabel, InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea, Spinner } from "@nowly/ui";
import {
  getExtensionDetected,
  requestExtension,
  subscribeExtensionDetected,
  type ExtensionDiagnostic,
} from "@/lib/extension-bridge";
import { RiCheckboxCircleLine, RiDiscordFill, RiFlagLine } from "@nowly/ui/icons";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

const REPORT_MAX_LENGTH = 750;
const PRODUCTION_API_URL = "https://api.nowly.me";

type ReportBrowser = {
  name: string
  version: string
};

const getReportBrowser = (): ReportBrowser => {
  const userAgent = navigator.userAgent;
  const matchers: Array<[string, RegExp]> = [
    ["Microsoft Edge", /(?:Edg|Edge|EdgA|EdgiOS)\/([\d.]+)/i],
    ["Opera", /(?:OPR|Opera Mini)\/([\d.]+)/i],
    ["Firefox", /(?:Firefox|FxiOS)\/([\d.]+)/i],
    ["Chrome", /(?:Chrome|CriOS)\/([\d.]+)/i],
    ["Safari", /Version\/([\d.]+).*Safari\//i],
  ];

  for (const [name, matcher] of matchers) {
    const match = userAgent.match(matcher);
    if (match?.[1]) return { name, version: match[1] };
  }

  return { name: "Unknown", version: "Unknown" };
};
type PresenceReportDialogProps = {
  slug: string
  name: string
  disabled?: boolean
};

const reportApiUrl = (slug: string): string => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? PRODUCTION_API_URL).replace(/\/$/, "");
  return `${base}/presences/${encodeURIComponent(slug)}/report`;
};

const extensionIsPresent = async (): Promise<boolean> => {
  try {
    const diagnostic = await requestExtension<ExtensionDiagnostic>("GET_DIAGNOSTIC", undefined, 3000);
    return diagnostic?.extensionInstalled === true;
  } catch {
    return false;
  }
};

export const PresenceReportDialog = ({ slug, name, disabled = false }: PresenceReportDialogProps) => {
  const t = useTranslations("presencePage");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const count = message.length;
  const canSubmit = message.trim().length > 0 && count <= REPORT_MAX_LENGTH && !busy;

  const reset = () => {
    setMessage("");
    setBusy(false);
    setSent(false);
    setError(false);
  };

  useEffect(() => subscribeExtensionDetected((value) => {
    if (!value) {
      setOpen(false);
      reset();
    }
  }), []);

  useEffect(() => {
    if (!disabled) return;
    setOpen(false);
    reset();
  }, [disabled]);

  const onOpenChange = (next: boolean) => {
    if (next && (disabled || getExtensionDetected() !== true)) return;
    setOpen(next);
    if (!next) reset();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || trimmed.length > REPORT_MAX_LENGTH) return;

    setBusy(true);
    setError(false);
    const browser = getReportBrowser();

    try {
      if (!(await extensionIsPresent())) {
        setError(true);
        setOpen(false);
        return;
      }

      const response = await fetch(reportApiUrl(slug), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          locale,
          browser: browser.name,
          browserVersion: browser.version,
        }),
      });

      if (!response.ok) {
        setError(true);
        return;
      }

      setSent(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="lg"
        disabled={disabled}
        onClick={() => onOpenChange(true)}
      >
        <RiFlagLine data-icon="inline-start" />
        {t("report")}
      </Button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton className="sm:max-w-md">
          {sent ? (
            <>
              <DialogHeader>
                <div className="mb-1 flex size-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 text-accent">
                  <RiCheckboxCircleLine className="size-5" />
                </div>
                <DialogTitle>{t("report-thanks-title")}</DialogTitle>
                <DialogDescription>{t("report-thanks-description", { name })}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <ButtonAnchor href={DISCORD_INVITE_URL} rel="noreferrer" target="_blank" variant="outline">
                  <RiDiscordFill data-icon="inline-start" />
                  {t("report-discord")}
                </ButtonAnchor>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("report-close")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>{t("report-title")}</DialogTitle>
                <DialogDescription>{t("report-description", { name })}</DialogDescription>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("report-data-notice")}{" "}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                    {t("report-privacy-link")}
                  </Link>
                </p>
              </DialogHeader>

              <Field data-invalid={error || undefined}>
                <FieldLabel htmlFor="presence-report">{t("report-label")}</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    id="presence-report"
                    value={message}
                    maxLength={REPORT_MAX_LENGTH}
                    rows={6}
                    placeholder={t("report-placeholder")}
                    disabled={busy}
                    aria-invalid={error || undefined}
                    onChange={(event) => {
                      setMessage(event.target.value.slice(0, REPORT_MAX_LENGTH));
                      if (error) setError(false);
                    }}
                  />
                  <InputGroupAddon align="block-end">
                    <InputGroupText className="ml-auto tabular-nums">
                      {t("report-count", { count, max: REPORT_MAX_LENGTH })}
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {error ? <FieldError>{t("report-error")}</FieldError> : null}
              </Field>

              <DialogFooter>
                <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
                  {t("report-cancel")}
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {busy ? <Spinner data-icon="inline-start" /> : null}
                  {busy ? t("report-sending") : t("report-submit")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
