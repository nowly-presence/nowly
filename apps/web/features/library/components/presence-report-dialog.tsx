"use client";

import { DISCORD_INVITE_URL } from "@/lib/constants";
import { Link } from "@/i18n/navigation";
import { ButtonAnchor } from "@nowly/ui/button-link";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, FieldError, FieldLabel, InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea, Spinner } from "@nowly/ui";
import { getExtensionDetected, requestExtension, subscribeExtensionDetected, type ExtensionDiagnostic, type ExtensionReportResult } from "@/lib/extension-bridge";
import { RiCheckboxCircleLine, RiDiscordFill, RiFlagLine } from "@nowly/ui/icons";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";

const REPORT_MAX_LENGTH = 2000;

type PresenceReportDialogProps = {
  slug: string;
  name: string;
  disabled?: boolean;
};

const extensionIsPresent = async (): Promise<boolean> => {
  try {
    const diagnostic = await requestExtension<ExtensionDiagnostic>("GET_DIAGNOSTIC", undefined, 3000);
    return diagnostic?.extensionInstalled === true;
  } catch {
    return false;
  }
};

type ReportChoiceProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  hint?: string;
  onSelect: () => void;
};

const ReportChoice = ({ checked, disabled = false, label, hint, onSelect }: ReportChoiceProps) => (
  <label
    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${checked ? "border-primary" : "border-border"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
  >
    <input type="radio" className="mt-1" checked={checked} disabled={disabled} onChange={onSelect} />
    <span className="grid gap-0.5">
      <span className="font-medium">{label}</span>
      {hint ? <span className="text-muted-foreground">{hint}</span> : null}
    </span>
  </label>
);

export const PresenceReportDialog = ({ slug, name, disabled = false }: PresenceReportDialogProps) => {
  const t = useTranslations("presencePage");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [anonymous, setAnonymous] = useState(true);
  const [notify, setNotify] = useState(true);
  const [pseudo, setPseudo] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const count = message.length;
  const canSubmit = message.trim().length > 0 && count <= REPORT_MAX_LENGTH && !busy;

  const reset = () => {
    setMessage("");
    setAnonymous(true);
    setNotify(true);
    setBusy(false);
    setSent(false);
    setError(false);
  };

  useEffect(() =>
    subscribeExtensionDetected((value) => {
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
    if (next) void requestExtension<{
      pseudo: string | null;
    }>("REPORT_IDENTITY")
      .then((identity) => setPseudo(identity?.pseudo ?? null))
      .catch(() => setPseudo(null));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();

    if (!trimmed || trimmed.length > REPORT_MAX_LENGTH) return;

    setBusy(true);
    setError(false);

    try {
      if (!(await extensionIsPresent())) {
        setError(true);
        setOpen(false);
        return;
      }

      const result = await requestExtension<ExtensionReportResult>("REPORT_CREATE", {
        slug,
        message: trimmed,
        anonymous: anonymous || pseudo === null,
        notify,
        locale
      });

      if (!result?.ok) {
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
      <Button type="button" variant="ghost" size="lg" disabled={disabled} onClick={() => onOpenChange(true)}>
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
                      {t("report-count", {
                        count,
                        max: REPORT_MAX_LENGTH
                      })}
                    </InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                {error ? <FieldError>{t("report-error")}</FieldError> : null}
              </Field>

              <fieldset className="grid gap-2" disabled={busy}>
                <legend className="mb-1 text-sm font-medium">{t("report-identity-title")}</legend>
                <ReportChoice
                  checked={!anonymous && pseudo !== null}
                  disabled={pseudo === null}
                  onSelect={() => setAnonymous(false)}
                  label={t("report-identity-named")}
                  hint={pseudo ?? t("report-identity-unavailable")}
                />
                <ReportChoice
                  checked={anonymous || pseudo === null}
                  onSelect={() => setAnonymous(true)}
                  label={t("report-identity-anonymous")}
                  hint={t("report-identity-anonymous-hint")}
                />
              </fieldset>

              <fieldset className="grid gap-2" disabled={busy}>
                <legend className="mb-1 text-sm font-medium">{t("report-notify-title")}</legend>
                <ReportChoice checked={notify} onSelect={() => setNotify(true)} label={t("report-notify-yes")} />
                <ReportChoice checked={!notify} onSelect={() => setNotify(false)} label={t("report-notify-no")} />
              </fieldset>

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