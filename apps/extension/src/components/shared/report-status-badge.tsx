import { useI18n, type MessageKey } from "@/hooks/i18n-provider";
import type { ReportStatus } from "@/shared/reports";
import { Badge } from "@/ui/badge";

type Tone = "neutral" | "primary" | "success" | "danger" | "outline";

export const REPORT_STATUS_LABELS: Record<ReportStatus, MessageKey> = {
  new: "report.status.new",
  in_progress: "report.status.inProgress",
  info_requested: "report.status.infoRequested",
  fixed: "report.status.fixed",
  closed: "report.status.closed"
};

const TONES: Record<ReportStatus, Tone> = {
  new: "neutral",
  in_progress: "neutral",
  info_requested: "primary",
  fixed: "success",
  closed: "outline"
};

export const ReportStatusBadge = ({ status }: {
  status: ReportStatus;
}) => {
  const { t } = useI18n();
  return (
    <Badge tone={TONES[status]}>
      {t(REPORT_STATUS_LABELS[status])}
    </Badge>
  );
};