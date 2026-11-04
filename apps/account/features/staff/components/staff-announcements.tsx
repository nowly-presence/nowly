"use client";

import { Frame } from "@/features/shell/components/frame";
import { OptionCards, type OptionCardsItem } from "@/features/shell/components/option-cards";
import { PageHeader } from "@/features/shell/components/page-header";
import { publishAnnouncement, type AnnouncementDraft, type AnnouncementKind } from "@/features/staff/lib/staff-api";
import { Button, Checkbox, Field, FieldLabel, Input, Textarea } from "@nowly/ui";
import { RiAlertLine, RiMegaphoneLine, RiToolsLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const KIND_ICONS = { normal: RiMegaphoneLine, warning: RiAlertLine, maintenance: RiToolsLine } as const;
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
      <form onSubmit={onSubmit} className="max-w-2xl">
        <Frame
          title={t("announcements-content-title")}
          description={t("announcements-translation-hint")}
          footer={
            <>
              <span className="text-xs">
                {state === "sent" ? <span className="text-muted-foreground">{t("announcements-sent")}</span> : null}
                {state === "failed" ? <span className="text-destructive">{t("error")}</span> : null}
              </span>
              <Button type="submit" disabled={busy || !valid}>
                {t("announcements-publish")}
              </Button>
            </>
          }
        >
          <OptionCards
            label={t("announcements-kind")}
            value={draft.kind}
            onValueChange={(kind) => patch({ kind })}
            options={KINDS.map((kind): OptionCardsItem<AnnouncementKind> => ({ value: kind, label: t(`announcements-kind-${kind}`), description: t(`announcements-kind-${kind}-hint`), icon: KIND_ICONS[kind] }))}
          />
          <Field>
            <FieldLabel>{t("announcements-field-title")}</FieldLabel>
            <Input value={draft.title} maxLength={160} placeholder={t("announcements-placeholder-title")} onChange={(event) => patch({ title: event.target.value })} />
          </Field>
          <Field>
            <FieldLabel>{t("announcements-field-description")}</FieldLabel>
            <Input value={draft.description} maxLength={600} placeholder={t("announcements-placeholder-description")} onChange={(event) => patch({ description: event.target.value })} />
          </Field>
          <Field>
            <FieldLabel>{t("announcements-field-content")}</FieldLabel>
            <Textarea value={draft.content} placeholder={t("announcements-placeholder-content")} onChange={(event) => patch({ content: event.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={draft.pinned} onCheckedChange={(checked) => patch({ pinned: checked === true })} />
            {t("announcements-pinned")}
          </label>
        </Frame>
      </form>
    </>
  );
};
