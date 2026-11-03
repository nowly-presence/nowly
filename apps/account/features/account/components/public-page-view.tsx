"use client";

import { AccountPageFrame } from "@/features/account/components/account-page-frame";
import { fetchPublicProfileSettings, PublicProfileError, savePublicProfileSettings, type PublicProfileSettings } from "@/features/account/lib/account-api";
import { siteBaseUrl } from "@/lib/api-base";
import { PUBLIC_LINK_MAX_LENGTH, PUBLIC_LINKS_MAX } from "@nowly/shared";
import { Button, Card, CardContent, Checkbox, Field, FieldDescription, FieldLabel, Input, Switch, Textarea } from "@nowly/ui";
import { RiAddLine, RiCloseLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const BIO_MAX_LENGTH = 280;

type Feedback = "saved" | "taken" | "invalid" | "failed" | null;

export const PublicPageView = () => {
  const t = useTranslations("accountPage");
  const [saved, setSaved] = useState<PublicProfileSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [bio, setBio] = useState("");
  const [showCreated, setShowCreated] = useState(true);
  const [showLiked, setShowLiked] = useState(true);
  const [links, setLinks] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const apply = (settings: PublicProfileSettings): void => {
    setSaved(settings);
    setEnabled(settings.enabled);
    setBio(settings.bio ?? "");
    setShowCreated(settings.showCreated);
    setShowLiked(settings.showLiked);
    setLinks(settings.links);
  };

  useEffect(() => {
    fetchPublicProfileSettings()
      .then(apply)
      .catch(() => setLoadFailed(true));
  }, []);

  const onSave = (): void => {
    setBusy(true);
    setFeedback(null);
    savePublicProfileSettings({
      enabled,
      bio: bio.trim() || null,
      showCreated,
      showLiked,
      links: links.map((link) => link.trim()).filter(Boolean)
    })
      .then((settings) => {
        apply(settings);
        setFeedback("saved");
      })
      .catch((error: unknown) => {
        if (error instanceof PublicProfileError) setFeedback(error.code === "HANDLE_TAKEN" ? "taken" : error.code === "INVALID" ? "invalid" : "failed");
        else setFeedback("failed");
      })
      .finally(() => setBusy(false));
  };

  return (
    <AccountPageFrame eyebrow={t("eyebrow")} title={t("public-title")} description={t("public-description")}>
      {!saved ? (
        <p className="text-sm text-muted-foreground">{loadFailed ? t("action-error") : t("checking")}</p>
      ) : (
        <Card className="max-w-xl">
          <CardContent className="flex flex-col gap-5">
            <label className="flex items-center justify-between gap-4 text-sm font-medium text-foreground">
              {t("public-enabled")}
              <Switch checked={enabled} onCheckedChange={setEnabled} disabled={busy} />
            </label>

            {saved.handle ? (
              <p className="text-sm text-muted-foreground">
                {t("public-address")} <span className="font-medium text-foreground">{`nowly.me/u/${saved.handle}`}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("public-handle-auto")}</p>
            )}

            <Field>
              <FieldLabel htmlFor="public-bio">{t("public-bio")}</FieldLabel>
              <Textarea id="public-bio" value={bio} maxLength={BIO_MAX_LENGTH} disabled={busy} onChange={(event) => setBio(event.target.value)} />
            </Field>

            <Field>
              <FieldLabel>{t("public-links")}</FieldLabel>
              <div className="flex flex-col gap-2">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      className="h-9"
                      type="url"
                      value={link}
                      maxLength={PUBLIC_LINK_MAX_LENGTH}
                      placeholder={t("public-link-placeholder")}
                      aria-label={t("public-links")}
                      disabled={busy}
                      onChange={(event) => setLinks((current) => current.map((entry, position) => (position === index ? event.target.value : entry)))}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label={t("public-link-remove")}
                      disabled={busy}
                      onClick={() => setLinks((current) => current.filter((_, position) => position !== index))}
                    >
                      <RiCloseLine />
                    </Button>
                  </div>
                ))}
                {links.length < PUBLIC_LINKS_MAX ? (
                  <div>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setLinks((current) => [...current, ""])}>
                      <RiAddLine data-icon="inline-start" />
                      {t("public-links-add")}
                    </Button>
                  </div>
                ) : null}
              </div>
              <FieldDescription>{t("public-links-hint", { max: PUBLIC_LINKS_MAX })}</FieldDescription>
            </Field>

            <label className="flex items-center gap-3 text-sm text-foreground">
              <Checkbox checked={showCreated} onCheckedChange={(value) => setShowCreated(value === true)} disabled={busy} />
              {t("public-show-created")}
            </label>
            <label className="flex items-center gap-3 text-sm text-foreground">
              <Checkbox checked={showLiked} onCheckedChange={(value) => setShowLiked(value === true)} disabled={busy} />
              {t("public-show-liked")}
            </label>

            <p className="text-xs text-muted-foreground">{t("public-privacy")}</p>

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={busy} onClick={onSave}>
                {t("public-save")}
              </Button>
              {saved.enabled && saved.handle ? (
                <a href={`${siteBaseUrl()}/u/${encodeURIComponent(saved.handle)}`} className="text-sm text-foreground underline underline-offset-4">
                  {t("public-view")}
                </a>
              ) : null}
            </div>
            {feedback === "saved" ? <p className="text-sm text-muted-foreground">{t("public-saved")}</p> : null}
            {feedback === "taken" ? <p className="text-sm text-destructive">{t("public-error-taken")}</p> : null}
            {feedback === "invalid" ? <p className="text-sm text-destructive">{t("public-error-invalid")}</p> : null}
            {feedback === "failed" ? <p className="text-sm text-destructive">{t("action-error")}</p> : null}
          </CardContent>
        </Card>
      )}
    </AccountPageFrame>
  );
};