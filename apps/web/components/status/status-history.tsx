import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, cn } from "@nowly/ui";
import type { StatusServiceReport, ServiceStatus, StatusSample } from "@/features/status/status";
import type { FC, ReactElement } from "react";

const statusBarClasses: Record<ServiceStatus, string> = {
  operational: "bg-success",
  slow: "bg-warning",
  degraded: "bg-warning",
  down: "bg-destructive",
  unknown: "bg-muted-foreground/20",
};

const formatDateTime = (date: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

const getSampleTitle = (
  sample: StatusSample | null,
  locale: string,
  labels: Record<ServiceStatus, string>,
  noData: string,
): string => {
  if (!sample) return noData;
  const latency = sample.responseMs === null ? noData : `${sample.responseMs} ms`;
  return `${formatDateTime(sample.checkedAt, locale)} · ${labels[sample.status]} · ${latency}`;
};

export const StatusHistory: FC<{
  service: StatusServiceReport;
  locale: string;
  labels: Record<ServiceStatus, string>;
  noData: string;
  historyLabel: string;
  sampleCount?: number;
}> = ({ service, locale, labels, noData, historyLabel, sampleCount = 12 }): ReactElement => {
  const reversed = service.samples.slice(0, sampleCount).reverse();
  const samples = Array.from({ length: sampleCount }, (_, index) => reversed[index] ?? null);

  return (
    <TooltipProvider delay={150}>
      <div className="flex h-5 min-w-0 items-end gap-[3px]" aria-label={historyLabel}>
        {samples.map((sample, index) => {
          const status = sample?.status ?? "unknown";
          const tooltip = getSampleTitle(sample, locale, labels, noData);

          return (
            <Tooltip key={`${sample?.checkedAt ?? "empty"}-${index}`}>
              <TooltipTrigger
                aria-label={tooltip}
                className={cn("h-full flex-1 cursor-default rounded-[2px] outline-none", statusBarClasses[status])}
              />

              <TooltipContent side="top">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
