"use client";

import { Frame } from "@/features/shell/components/frame";
import { StaffAnnouncementEditor } from "@/features/staff/components/staff-announcement-editor";
import { StaffAnnouncementRow } from "@/features/staff/components/staff-announcement-row";
import { deleteAnnouncement, fetchManagedAnnouncements, updateAnnouncement } from "@/features/staff/lib/staff-api";
import type { Announcement } from "@nowly/shared/announcements";
import { AlertDialog, AlertDialogCancel, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@nowly/ui";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export const StaffAnnouncementList = ({ revision }: {
  revision: number;
}) => {
  const t = useTranslations("staff");
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [now] = useState(() => Date.now());

  const load = useCallback((): void => {
    fetchManagedAnnouncements()
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load();
  }, [load, revision]);

  const run = (action: Promise<unknown>): void => {
    setBusy(true);
    setFailed(false);
    action
      .then(load)
      .catch(() => setFailed(true))
      .finally(() => setBusy(false));
  };

  const onTogglePinned = (item: Announcement): void => {
    run(
      updateAnnouncement(item.id, {
        translations: item.translations,
        kind: item.kind,
        severity: item.severity,
        pinned: !item.pinned,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        expiresAt: item.expiresAt
      })
    );
  };

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {failed ? <p className="text-sm text-destructive">{t("error")}</p> : null}
      {!items && !failed ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
      {items ? (
        <Frame title={t("announcements-list-title", { count: items.length })} description={t("announcements-list-description")} padded={false}>
          {items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{t("announcements-empty")}</p> : null}
          {items.map((item) => (
            <StaffAnnouncementRow
              key={item.id}
              item={item}
              now={now}
              busy={busy}
              onEdit={() => setEditing(item)}
              onTogglePinned={() => onTogglePinned(item)}
              onDelete={() => setDeleting(item)}
            />
          ))}
        </Frame>
      ) : null}
      {editing ? (
        <StaffAnnouncementEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      ) : null}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => (!open ? setDeleting(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("announcements-delete-title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("announcements-delete-description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("peek-cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleting) run(deleteAnnouncement(deleting.id));
                setDeleting(null);
              }}
            >
              {t("announcements-delete-confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};