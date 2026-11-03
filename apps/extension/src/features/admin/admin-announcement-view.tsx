import { useState } from "react";
import { RiSendPlaneLine } from "@remixicon/react";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { sendMessage } from "@/lib/messages";
import { announcementIssues, buildAnnouncementInput, CONTENT_MAX_LENGTH, DESCRIPTION_MAX_LENGTH, EMPTY_TEXTS, emptyAnnouncementForm, TITLE_MAX_LENGTH, type AnnouncementForm, type AnnouncementKind, type AnnouncementSeverity, type AnnouncementTexts } from "@/shared/admin/announcement-draft";
import { LOCALE_NAMES } from "@/shared/locales";
import { ANNOUNCEMENT_LOCALES, type AnnouncementLocale } from "@nowly/shared/announcements";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Field } from "@/ui/field";
import { Input } from "@/ui/input";
import { Segmented } from "@/ui/segmented";
import { Select } from "@/ui/select";
import { SwitchRow } from "@/ui/row";
import { Textarea } from "@/ui/textarea";
import { useToast } from "@/ui/toast";
import { adminErrorKey } from "@/lib/admin-error";

const SEVERITIES: AnnouncementSeverity[] = [1, 2, 3];

export const AdminAnnouncementView = () => {
  const { t, locale } = useI18n();
  const { pop } = useNav();
  const { patch } = useExtensionState();
  const { toast } = useToast();
  const [form, setForm] = useState<AnnouncementForm>(emptyAnnouncementForm);
  const [editing, setEditing] = useState<AnnouncementLocale>("en");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const texts = form.texts[editing] ?? EMPTY_TEXTS;
  const issues = announcementIssues(form);

  const setTexts = (next: Partial<AnnouncementTexts>) =>
    setForm((current) => ({
      ...current,
      texts: {
        ...current.texts,
        [editing]: { ...(current.texts[editing] ?? EMPTY_TEXTS), ...next }
      }
    }));

  const send = async () => {
    setSending(true);
    setError(null);
    const result = await sendMessage("ADMIN_CREATE_ANNOUNCEMENT", { announcement: buildAnnouncementInput(form) });
    setSending(false);

    if (!result.ok) {
      setError(result.message ?? t(adminErrorKey(result.error)));
      return;
    }

    toast(t("admin.announcement.sent"), "success");
    void sendMessage("REFRESH_ANNOUNCEMENTS", { locale })
      .then((announcements) => patch({ announcements }))
      .catch(() => undefined);
    pop();
  };

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader title={t("admin.announcement.title")} onBack={pop} backLabel={t("action.back")} />
      <ScreenBody className="pt-0">
        <Card className="flex flex-col gap-4 p-4">
          <Field label={t("admin.announcement.language")} hint={t("admin.announcement.languageHint")}>
            <Select
              aria-label={t("admin.announcement.language")}
              value={editing}
              options={ANNOUNCEMENT_LOCALES.map((value) => ({
                value,
                label: `${LOCALE_NAMES[value]}${form.texts[value]?.title.trim() ? " *" : ""}`
              }))}
              onChange={(value) => setEditing(ANNOUNCEMENT_LOCALES.find((entry) => entry === value) ?? editing)}
            />
          </Field>
          <Field label={t("admin.announcement.titleLabel")}>
            <Input
              placeholder={t("admin.announcement.titlePlaceholder")}
              value={texts.title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(event) => setTexts({ title: event.target.value })}
            />
          </Field>
          <Field label={t("admin.announcement.description")}>
            <Textarea
              className="min-h-20"
              placeholder={t("admin.announcement.descriptionPlaceholder")}
              value={texts.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              onChange={(event) => setTexts({ description: event.target.value })}
            />
          </Field>
          <Field label={t("admin.announcement.content")} hint={t("admin.announcement.contentHint")} optional={t("creator.texts.optional")}>
            <Textarea
              className="min-h-40"
              placeholder={t("admin.announcement.contentPlaceholder")}
              value={texts.content}
              maxLength={CONTENT_MAX_LENGTH}
              onChange={(event) => setTexts({ content: event.target.value })}
            />
          </Field>
        </Card>

        <Card className="flex flex-col gap-4 p-4">
          <Field label={t("admin.announcement.kind")}>
            <Segmented<AnnouncementKind>
              label={t("admin.announcement.kind")}
              value={form.kind}
              options={[
                {
                  value: "normal",
                  label: t("admin.announcement.kindNormal")
                },
                {
                  value: "warning",
                  label: t("admin.announcement.kindWarning")
                },
                {
                  value: "maintenance",
                  label: t("admin.announcement.kindMaintenance")
                }
              ]}
              onChange={(kind) => setForm((current) => ({ ...current, kind }))}
            />
          </Field>
          {form.kind === "warning" && (
            <Field label={t("admin.announcement.severity")}>
              <Segmented<`${AnnouncementSeverity}`>
                label={t("admin.announcement.severity")}
                value={`${form.severity}`}
                options={SEVERITIES.map((value) => ({
                  value: `${value}` as const,
                  label: `${value}`
                }))}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    severity: SEVERITIES.find((entry) => `${entry}` === value) ?? current.severity
                  }))
                }
              />
            </Field>
          )}
          <SwitchRow
            title={t("admin.announcement.pinned")}
            description={t("admin.announcement.pinnedHint")}
            label={t("admin.announcement.pinned")}
            checked={form.pinned}
            onChange={(pinned) => setForm((current) => ({ ...current, pinned }))}
          />
          <Field label={t("admin.announcement.startsAt")} optional={t("creator.texts.optional")}>
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startsAt: event.target.value
                }))
              }
            />
          </Field>
          <Field label={t("admin.announcement.expiresAt")} optional={t("creator.texts.optional")} invalid={issues.includes("DATES_ORDER")}>
            <Input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  expiresAt: event.target.value
                }))
              }
            />
          </Field>
        </Card>

        {issues.includes("TEXTS_MISSING") && <p className="px-1 text-label-md text-muted">{t("admin.announcement.issueTexts")}</p>}
        {issues.includes("TEXTS_INCOMPLETE") && <p className="px-1 text-label-md text-muted">{t("admin.announcement.issueIncomplete")}</p>}
        {issues.includes("DATES_ORDER") && <p className="px-1 text-label-md text-danger">{t("admin.announcement.issueDates")}</p>}
        {error && <p className="px-1 text-label-md text-danger">{error}</p>}
        <Button icon={<RiSendPlaneLine className="size-4" />} loading={sending} disabled={issues.length > 0} onClick={() => void send()}>
          {t("admin.announcement.send")}
        </Button>
      </ScreenBody>
    </div>
  );
};