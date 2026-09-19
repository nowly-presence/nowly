import type { FC, ReactNode } from "react";
import { StatusIcon, type RowStatus } from "@/features/diagnostics/status-icon";

type Props = {
  action?: ReactNode;
  label: string;
  message: string;
  status: RowStatus;
};

export const StatusRow: FC<Props> = ({ action, label, message, status }) => (
  <div className="flex items-start gap-2 rounded-lg border border-border bg-card-2 px-3 py-2">
    <span className="mt-0.5 shrink-0">
      <StatusIcon status={status} />
    </span>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{message}</p>
      {action ? <div className="mt-2 flex flex-wrap gap-1.5">{action}</div> : null}
    </div>
  </div>
);