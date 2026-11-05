"use client";

import { OptionCards, type OptionCardsItem } from "@/features/shell/components/option-cards";
import type { AnnouncementDraft, AnnouncementKind } from "@/features/staff/lib/announcement-draft";
import { Checkbox, Field, FieldLabel, Input, Textarea } from "@nowly/ui";
import { RiAlertLine, RiMegaphoneLine, RiToolsLine } from "@nowly/ui/icons";
import { useTranslations } from "next-intl";

const KIND_ICONS = {
  normal: RiMegaphoneLine,
  warning: RiAlertLine,
  maintenance: RiToolsLine
} as const;
const KINDS: readonly AnnouncementKind[] = ["normal", "warning", "maintenance"];

export const StaffAnnouncementFields = ({ draft, onChange }: {
  draft: AnnouncementDraft;
  onChange: (value: Partial<AnnouncementDraft>) => void;
}) => {
  const t = useTranslations("staff");
  const reversed = draft.startsAt !== "" && draft.endsAt !== "" && Date.parse(draft.startsAt) >= Date.parse(draft.endsAt);

  return (
    <>
      <OptionCards
        label={t("announcements-kind")}
        value={draft.kind}
        onValueChange={(kind) => onChange({ kind })}
        options={KINDS.map((kind): OptionCardsItem<AnnouncementKind> => ({
          value: kind,
          label: t(`announcements-kind-${kind}`),
          description: t(`announcements-kind-${kind}-hint`),
          icon: KIND_ICONS[kind]
        }))}
      />
      <Field>
        <FieldLabel>{t("announcements-field-title")}</FieldLabel>
        <Input
          value={draft.title}
          maxLength={160}
          placeholder={t("announcements-placeholder-title")}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>{t("announcements-field-description")}</FieldLabel>
        <Input
          value={draft.description}
          maxLength={600}
          placeholder={t("announcements-placeholder-description")}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel>{t("announcements-field-content")}</FieldLabel>
        <Textarea value={draft.content} placeholder={t("announcements-placeholder-content")} onChange={(event) => onChange({ content: event.target.value })} />
      </Field>
      {draft.kind === "maintenance" ? (
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>{t("announcements-field-starts")}</FieldLabel>
              <Input type="datetime-local" value={draft.startsAt} onChange={(event) => onChange({ startsAt: event.target.value })} />
            </Field>
            <Field>
              <FieldLabel>{t("announcements-field-ends")}</FieldLabel>
              <Input
                type="datetime-local"
                value={draft.endsAt}
                min={draft.startsAt || undefined}
                onChange={(event) => onChange({ endsAt: event.target.value })}
              />
            </Field>
          </div>
          <p className={reversed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {reversed ? t("announcements-window-invalid") : t("announcements-window-hint")}
          </p>
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox checked={draft.pinned} onCheckedChange={(checked) => onChange({ pinned: checked === true })} />
        {t("announcements-pinned")}
      </label>
    </>
  );
};