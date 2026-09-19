import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconCheck, IconCopy, IconTrash } from "@/lib/tabler-icons";
import type { FC } from "react";

type Props = {
  clearConfirmed: boolean;
  copyConfirmed: boolean;
  onClear: () => void;
  onCopy: () => void;
};

export const RuntimeLogToolbar: FC<Props> = ({
  clearConfirmed,
  copyConfirmed,
  onClear,
  onCopy,
}) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{t("runtime-logs-title")}</p>
      <p className="text-xs text-muted-foreground">{t("runtime-logs-description")}</p>
    </div>
    <div className="flex items-center gap-1">
      <Button
        variant="unstyled"
        size="none"
        onClick={onCopy}
        className={`flex h-8 items-center gap-1 rounded-md border px-2 text-xs transition-all ${
          copyConfirmed
            ? "animate-pulse border-success/40 bg-success/10 text-success"
            : "border-border bg-card-2 text-muted-foreground hover:text-foreground"
        }`}
        title={t("runtime-logs-copy-title")}
      >
        {copyConfirmed ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
        {copyConfirmed ? t("runtime-logs-copied") : t("runtime-logs-copy-json")}
      </Button>
      <Button
        variant="unstyled"
        size="none"
        onClick={onClear}
        className={`flex h-8 items-center gap-1 rounded-md border px-2 text-xs transition-all ${
          clearConfirmed
            ? "animate-pulse border-success/40 bg-success/10 text-success"
            : "border-border bg-card-2 text-muted-foreground hover:text-foreground"
        }`}
        title={t("runtime-logs-clear-title")}
      >
        {clearConfirmed ? <IconCheck className="h-3.5 w-3.5" /> : <IconTrash className="h-3.5 w-3.5" />}
        {clearConfirmed ? t("runtime-logs-cleared") : t("runtime-logs-clear")}
      </Button>
    </div>
  </div>
);
