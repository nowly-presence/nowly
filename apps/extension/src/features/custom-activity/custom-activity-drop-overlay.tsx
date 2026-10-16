import { RiFileUploadLine } from "@remixicon/react";
import { useI18n } from "@/hooks/i18n-provider";

export const CustomActivityDropOverlay = () => {
  const { t } = useI18n();
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex animate-enter-up items-center justify-center bg-surface/85 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-80 flex-col items-center gap-3 rounded-lg border-2 border-dashed border-primary bg-primary-soft px-6 py-10 text-center">
        <RiFileUploadLine className="size-8 text-primary" />
        <p className="text-body-lg font-medium tracking-[-0.2px] text-ink">{t("custom.import.dropTitle")}</p>
        <p className="text-body-sm text-muted">{t("custom.import.dropHint")}</p>
      </div>
    </div>
  );
};