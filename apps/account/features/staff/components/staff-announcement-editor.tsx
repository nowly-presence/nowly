"use client";

import { StaffAnnouncementFields } from "@/features/staff/components/staff-announcement-fields";
import { buildInput, draftFromAnnouncement, isDraftValid, keepTranslations, textsChanged, translateAll, type AnnouncementDraft, type TranslationProgress } from "@/features/staff/lib/announcement-draft";
import { updateAnnouncement } from "@/features/staff/lib/staff-api";
import type { Announcement } from "@nowly/shared/announcements";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Spinner } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

export const StaffAnnouncementEditor = ({ item, onSaved, onClose }: {
  item: Announcement;
  onSaved: () => void;
  onClose: () => void;
}) => {
  const t = useTranslations("staff");
  const [draft, setDraft] = useState<AnnouncementDraft>(() => draftFromAnnouncement(item));
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const retranslate = textsChanged(draft, item);

  const patch = (value: Partial<AnnouncementDraft>): void => {
    setFailed(false);
    setDraft((current) => ({ ...current, ...value }));
  };

  const onSave = (): void => {
    setBusy(true);
    setFailed(false);
    const source = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      content: draft.content.trim()
    };
    (retranslate ? translateAll(source, setProgress) : Promise.resolve(keepTranslations(item, draft)))
      .then((translations) => updateAnnouncement(item.id, buildInput(draft, translations, item)))
      .then(onSaved)
      .catch(() => {
        setFailed(true);
        setBusy(false);
        setProgress(null);
      });
  };

  return (
    <Dialog open onOpenChange={(open) => (!open && !busy ? onClose() : undefined)}>
      <DialogContent className="max-h-[90vh] gap-4 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("announcements-edit-title")}</DialogTitle>
          <DialogDescription>{retranslate ? t("announcements-retranslate-hint") : t("announcements-translation-hint")}</DialogDescription>
        </DialogHeader>
        <StaffAnnouncementFields draft={draft} onChange={patch} />
        <DialogFooter>
          {failed ? <span className="mr-auto self-center text-xs text-destructive">{t("error")}</span> : null}
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {t("peek-cancel")}
          </Button>
          <Button disabled={busy || !isDraftValid(draft)} onClick={onSave}>
            {busy ? <Spinner /> : null}
            {progress ? t("announcements-translating", progress) : t("announcements-save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};