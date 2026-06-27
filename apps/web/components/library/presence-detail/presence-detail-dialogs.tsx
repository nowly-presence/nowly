"use client";

import { Dialog, DialogAction, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle } from "@/components/ui/dialog";
import type { Presence } from "@/lib/data/presences";
import { IconTrash, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  presence: Presence
  showUninstallConfirm: boolean
  setShowUninstallConfirm: (open: boolean) => void
  showDowngradeConfirm: boolean
  setShowDowngradeConfirm: (open: boolean) => void
  onConfirmUninstall: () => void
  onConfirmDowngrade: () => void
};

export const PresenceDetailDialogs: FC<Props> = ({
  presence,
  showUninstallConfirm,
  setShowUninstallConfirm,
  showDowngradeConfirm,
  setShowDowngradeConfirm,
  onConfirmUninstall,
  onConfirmDowngrade,
}): ReactElement => {
  const t = useTranslations("marketplace-detail");

  return (
    <>
      <Dialog open={showUninstallConfirm} onOpenChange={setShowUninstallConfirm}>
        <DialogContent variant="destructive">
          <DialogHeader>
            <DialogMedia>
              <IconTrash className="h-5 w-5" />
            </DialogMedia>

            <DialogTitle>{t("uninstall-confirm-title")}</DialogTitle>

            <DialogDescription>
              {t("uninstall-confirm-description", { platform: presence.name })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogAction variant="destructive" onClick={onConfirmUninstall}>
              {t("uninstall-confirm-action")}
            </DialogAction>

            <DialogCancel>{t("uninstall-confirm-cancel")}</DialogCancel>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDowngradeConfirm} onOpenChange={setShowDowngradeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogMedia>
              <IconAlertTriangle className="h-5 w-5" />
            </DialogMedia>

            <DialogTitle>{t("downgrade-confirm-title")}</DialogTitle>

            <DialogDescription>
              {t("downgrade-confirm-description", { platform: presence.name })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogAction onClick={onConfirmDowngrade}>
              {t("downgrade-confirm-action")}
            </DialogAction>

            <DialogCancel>{t("downgrade-confirm-cancel")}</DialogCancel>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
