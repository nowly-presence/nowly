import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import { IconCheck, IconCopy, IconTrash } from "@tabler/icons-react";
import type { FC } from "react";

type Props = {
  clearConfirmed: boolean;
  copyConfirmed: boolean;
  onClear: () => void;
  onCopy: () => void;
};

export const AnalyticsLogToolbar: FC<Props> = ({
  clearConfirmed,
  copyConfirmed,
  onClear,
  onCopy,
}) => (
  <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground">{t("analytics-logs-title")}</p>
      <p className="text-xs text-muted-foreground">{t("analytics-logs-description")}</p>
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
        title={t("analytics-logs-copy-title")}
      >
        {copyConfirmed ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
        {copyConfirmed ? t("analytics-logs-copied") : t("analytics-logs-copy-json")}
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
        title={t("analytics-logs-clear-title")}
      >
        {clearConfirmed ? <IconCheck className="h-3.5 w-3.5" /> : <IconTrash className="h-3.5 w-3.5" />}
        {clearConfirmed ? t("analytics-logs-cleared") : t("analytics-logs-clear")}
      </Button>
    </div>
  </div>
);