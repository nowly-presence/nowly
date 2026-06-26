"use client";

import type { Presence } from "@/lib/data/presences";
import type { FC, ReactElement } from "react";
import { PresenceDetailContent } from "./presence-detail-content";
import { PresenceDetailDialogs } from "./presence-detail-dialogs";
import { usePresenceStatus } from "./use-presence-status";

type Props = {
  presence: Presence
};

export const PresenceDetailClient: FC<Props> = ({ presence }): ReactElement => {
  const status = usePresenceStatus(presence);

  return (
    <>
      <PresenceDetailContent
        presence={presence}
        isInstalled={status.isInstalled}
        extDetected={status.extDetected}
        needsUpdate={status.needsUpdate}
        loading={status.loading}
        onInstall={status.handleInstall}
        onUninstall={status.handleUninstallRequest}
      />

      <PresenceDetailDialogs
        presence={presence}
        showUninstallConfirm={status.showUninstallConfirm}
        setShowUninstallConfirm={status.setShowUninstallConfirm}
        showDowngradeConfirm={status.showDowngradeConfirm}
        setShowDowngradeConfirm={status.setShowDowngradeConfirm}
        onConfirmUninstall={status.confirmUninstall}
        onConfirmDowngrade={status.confirmDowngrade}
      />
    </>
  );
};