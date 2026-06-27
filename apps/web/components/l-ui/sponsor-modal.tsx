"use client";

import { KofiIcon } from "@/components/icons";
import { Dialog, DialogCancel, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogMedia, DialogTitle } from "@/components/ui/dialog";
import { PROJECT_EXTENSION_DOWNLOAD_URL } from "@/lib/constants";
import { IconCoffee } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

interface SponsorModalProps {
  isOpen: boolean
  onClose: () => void
  downloadOnAction?: boolean
}

export function SponsorModal({ isOpen, onClose, downloadOnAction = false }: SponsorModalProps) {
  const t = useTranslations("sponsor-modal");

  const triggerDownload = () => {
    const a = document.createElement("a");
    a.href = PROJECT_EXTENSION_DOWNLOAD_URL;
    a.download = "";
    a.click();
  };

  const handleKofiSupport = () => {
    window.open("https://ko-fi.com/qkimi_", "_blank", "noopener,noreferrer");
    if (downloadOnAction) triggerDownload();
  };

  const handleCancel = () => {
    if (downloadOnAction) triggerDownload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent variant="default">
        <DialogHeader>
          <DialogMedia>
            <IconCoffee className="w-4 h-4" />
          </DialogMedia>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2">
          <p className="mb-3 text-center text-sm font-semibold text-foreground">
            {t("supportTitle")}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-center">
              <span className="text-xs font-medium text-muted-foreground">GitHub Sponsors</span>
              <iframe
                src="https://github.com/sponsors/nowly-presence/button"
                title="Sponsor nowly-presence"
                height="32"
                width="114"
                className="rounded-md border-0"
                loading="lazy"
              />
            </div>

            <button
              type="button"
              onClick={handleKofiSupport}
              className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-center transition-colors hover:border-border-light hover:bg-muted/60"
            >
              <span className="text-xs font-medium text-muted-foreground">Ko-fi</span>
              <span className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background">
                <KofiIcon className="w-4 h-4" />
                {t("supportKofi")}
              </span>
            </button>
          </div>
        </div>
        <DialogFooter>
          <DialogCancel onClick={handleCancel}>
            {downloadOnAction ? t("skipDownload") : t("close")}
          </DialogCancel>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
