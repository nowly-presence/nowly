"use client";

import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@nowly/ui";
import { useTranslations } from "next-intl";
import type { PublicationStatus } from "@nowly/shared";
import { ExtensionStoreButton } from "@/components/extension-store-button";

export type ActivityCopyChoice = "install" | "keep" | "replace";
type ActivitySharingActionsProps = {
  detected: boolean;
  status: PublicationStatus | null;
  revision: number;
  busy: boolean;
  message: string | null;
  onApply: (choice: ActivityCopyChoice) => Promise<boolean>;
};

export const ActivitySharingActions = ({ detected, status, revision, busy, message, onApply }: ActivitySharingActionsProps) => {
  const t = useTranslations("activitySharing");
  const [open, setOpen] = useState(false);
  const choose = async (choice: ActivityCopyChoice) => {
    if (await onApply(choice)) setOpen(false);
  };

  if (!detected) return <ExtensionStoreButton variant="default" />;
  if (!status?.ok) {
    return (
      <Button variant="outline" onClick={() => window.location.reload()}>
        {t("refresh")}
      </Button>
    );
  }
  if (!status.installed) {
    return (
      <Button variant="default" disabled={busy} onClick={() => void onApply("install")}>
        {t("install")}
      </Button>
    );
  }

  const canReplace = status.revision !== revision || status.modified;

  if (!canReplace) return (
    <Button disabled>
      {t("upToDate")}
    </Button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) setOpen(next);
      }}
    >
      <DialogTrigger render={<Button disabled={busy} />}>{t("update")}</DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("update")}</DialogTitle>
          <DialogDescription>{t(status.modified ? "conflict" : "updateDescription")}</DialogDescription>
        </DialogHeader>
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => void choose("keep")}>
            {t("keep")}
          </Button>
          <Button disabled={busy} onClick={() => void choose("replace")}>
            {t("replace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};