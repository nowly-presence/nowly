"use client";

import { Spinner } from "@/components/ui/spinner";
import { useOs } from "@/hooks/use-os";
import { cn } from "@/lib/utils";
import { IconDownload, IconTrash } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import type { FC } from "react";

type Props = {
  isInstalled: boolean
  isExtDetected: boolean
  needsUpdate: boolean
  loading: boolean
  onInstall: () => void
  onUninstall: () => void
};

export const PresenceHeaderActions: FC<Props> = ({
  isInstalled,
  isExtDetected,
  needsUpdate,
  loading,
  onInstall,
  onUninstall,
}) => {
  const t = useTranslations("marketplace-detail");
  const os = useOs();
  const isMobileOs = os === "android" || os === "ios";

  const hasInstall = !isInstalled || needsUpdate;
  const hasUninstall = isInstalled && isExtDetected && !loading;
  const isInstallDisabled = loading || isMobileOs;

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        {hasInstall && (
          <button
            onClick={onInstall}
            disabled={isInstallDisabled}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm transition-all sm:w-auto sm:py-1.5",
              isInstallDisabled
                ? "bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60"
                : isExtDetected && needsUpdate && !loading
                  ? "bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20"
                  : "bg-foreground text-background hover:bg-[#e4e4e7]",
            )}
          >
            {loading ? <Spinner /> : <IconDownload className="w-4 h-4" />}
            {loading ? t("installing") : needsUpdate ? t("update-action") : t("install-action")}
          </button>
        )}

        {hasUninstall && (
          <button
            onClick={onUninstall}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition-all border border-destructive/20 hover:bg-destructive/20 sm:w-auto sm:py-1.5"
          >
            <IconTrash className="w-4 h-4" />
            {t("uninstall-action")}
          </button>
        )}
      </div>
    </div>
  );
};
