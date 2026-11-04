"use client";

import { PageHeader } from "@/features/shell/components/page-header";
import { publishAnnouncement, type AnnouncementDraft, type AnnouncementKind } from "@/features/staff/lib/staff-api";
import { Button, Card, CardContent, Checkbox, Field, FieldLabel, Input, Textarea } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const KINDS: readonly AnnouncementKind[] = ["normal", "warning", "maintenance"];
const EMPTY: AnnouncementDraft = { title: "", description: "", content: "", kind: "normal", pinned: false };

export const StaffAnnouncements = () => {
  const t = useTranslations("staff");
  const [draft, setDraft] = useState<AnnouncementDraft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "sent" | "failed">("idle");

  const patch = (value: Partial<AnnouncementDraft>): void => {
    setState("idle");
    setDraft((current) => ({ ...current, ...value }));
  };

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setBusy(true);
    publishAnnouncement({ ...draft, title: draft.title.trim(), description: draft.description.trim(), content: draft.content.trim() })
      .then(() => {
        setDraft(EMPTY);
        setState("sent");
      })
      .catch(() => setState("failed"))
      .finally(() => setBusy(false));
  };

  const valid = draft.title.trim().length > 0 && draft.description.trim().length > 0;

  return (
    <>
      <PageHeader title={t("announcements-title")} description={t("announcements-description")} />
      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("announcements-kind")}>
              {KINDS.map((kind) => (
                <Button key={kind} type="button" size="sm" variant={draft.kind === kind ? "secondary" : "ghost"} aria-pressed={draft.kind === kind} onClick={() => patch({ kind })}>
                  {t(`announcements-kind-${kind}`)}
                </Button>
              ))}
            </div>
            <Field>
              <FieldLabel>{t("announcements-field-title")}</FieldLabel>
              <Input value={draft.title} maxLength={160} onChange={(event) => patch({ title: event.target.value })} />
            </Field>
            <Field>
              <FieldLabel>{t("announcements-field-description")}</FieldLabel>
              <Input value={draft.description} maxLength={600} onChange={(event) => patch({ description: event.target.value })} />
            </Field>
            <Field>
              <FieldLabel>{t("announcements-field-content")}</FieldLabel>
              <Textarea value={draft.content} onChange={(event) => patch({ content: event.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={draft.pinned} onCheckedChange={(checked) => patch({ pinned: checked === true })} />
              {t("announcements-pinned")}
            </label>
            <p className="text-xs text-muted-foreground">{t("announcements-translation-hint")}</p>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy || !valid}>
                {t("announcements-publish")}
              </Button>
              {state === "sent" ? <span className="text-sm text-muted-foreground">{t("announcements-sent")}</span> : null}
              {state === "failed" ? <span className="text-sm text-destructive">{t("error")}</span> : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};
