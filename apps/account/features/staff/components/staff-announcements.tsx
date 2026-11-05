"use client";

import { Frame } from "@/features/shell/components/frame";
import { PageHeader } from "@/features/shell/components/page-header";
import { StaffAnnouncementFields } from "@/features/staff/components/staff-announcement-fields";
import { StaffAnnouncementList } from "@/features/staff/components/staff-announcement-list";
import { buildInput, EMPTY_DRAFT, isDraftValid, translateAll, type AnnouncementDraft, type TranslationProgress } from "@/features/staff/lib/announcement-draft";
import { createAnnouncement } from "@/features/staff/lib/staff-api";
import { Button, Spinner } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

export const StaffAnnouncements = () => {
  const t = useTranslations("staff");
  const [draft, setDraft] = useState<AnnouncementDraft>(EMPTY_DRAFT);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "sent" | "failed">("idle");
  const [revision, setRevision] = useState(0);

  const patch = (value: Partial<AnnouncementDraft>): void => {
    setState("idle");
    setDraft((current) => ({ ...current, ...value }));
  };

  const onSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setBusy(true);
    setState("idle");
    const source = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      content: draft.content.trim()
    };
    translateAll(source, setProgress)
      .then((translations) => createAnnouncement(buildInput(draft, translations)))
      .then(() => {
        setDraft(EMPTY_DRAFT);
        setState("sent");
        setRevision((value) => value + 1);
      })
      .catch(() => setState("failed"))
      .finally(() => {
        setBusy(false);
        setProgress(null);
      });
  };

  return (
    <>
      <PageHeader title={t("announcements-title")} description={t("announcements-description")} />
      <div className="flex flex-col gap-6">
        <form onSubmit={onSubmit} className="max-w-2xl">
          <Frame
            title={t("announcements-content-title")}
            description={t("announcements-translation-hint")}
            footer={
              <>
                <span className="text-xs" aria-live="polite">
                  {state === "sent" ? <span className="text-muted-foreground">{t("announcements-sent")}</span> : null}
                  {state === "failed" ? <span className="text-destructive">{t("error")}</span> : null}
                </span>
                <Button type="submit" disabled={busy || !isDraftValid(draft)}>
                  {busy ? <Spinner /> : null}
                  {progress ? t("announcements-translating", progress) : t("announcements-publish")}
                </Button>
              </>
            }
          >
            <StaffAnnouncementFields draft={draft} onChange={patch} />
          </Frame>
        </form>
        <StaffAnnouncementList revision={revision} />
      </div>
    </>
  );
};