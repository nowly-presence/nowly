import { useState } from "react";
import { PresenceIcon } from "@/components/shared/presence-icon";
import { ReportStatusBadge } from "@/components/shared/report-status-badge";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { useStaffReportList } from "@/hooks/use-staff-report-list";
import { readableName } from "@/lib/readable-name";
import type { StaffReportFilter } from "@/shared/reports";
import { Chip } from "@/ui/chip";
import { Group } from "@/ui/card";
import { DotSeparator } from "@/ui/dot-separator";
import { EmptyState } from "@/ui/empty-state";
import { Row } from "@/ui/row";
import { Skeleton } from "@/ui/skeleton";

const ICON_SIZE = 36;
const PREVIEW_MAX = 80;
const FILTERS: StaffReportFilter[] = ["todo", "waiting", "mine", "all"];

const FILTER_KEYS = {
  todo: "report.staff.filterTodo",
  waiting: "report.staff.filterWaiting",
  mine: "report.staff.filterMine",
  all: "report.staff.filterAll"
} as const;

export const AdminReportsView = () => {
  const { t } = useI18n();
  const { pop, push } = useNav();
  const [filter, setFilter] = useState<StaffReportFilter>("todo");
  const { reports, error } = useStaffReportList(true, filter);

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader title={t("report.staff.title")} onBack={pop} backLabel={t("action.back")} />
      <ScreenBody className="pt-0">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("report.staff.title")}>
          {FILTERS.map((entry) => (
            <Chip key={entry} active={filter === entry} onClick={() => setFilter(entry)}>
              {t(FILTER_KEYS[entry])}
            </Chip>
          ))}
        </div>
        {error && <p className="px-1 text-label-md text-danger">{t("report.loadError")}</p>}
        {!reports && !error && <Skeleton className="h-16" />}
        {reports && reports.length === 0 && <EmptyState title={t("report.staff.empty")} description={t("report.staff.emptyHint")} />}
        {reports && reports.length > 0 && (
          <Group>
            {reports.map((report) => {
              const name = readableName(report.slug);
              const text = report.lastMessage?.body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX) ?? "";

              return (
                <Row
                  key={report.id}
                  onClick={() =>
                    push({
                      name: "admin-report",
                      id: report.id
                    })
                  }
                  leading={<PresenceIcon slug={report.slug} name={name} size={ICON_SIZE} />}
                  title={name}
                  description={
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate">{text}</span>
                      <span className="flex items-center gap-1.5">
                        <ReportStatusBadge status={report.status} />
                        <DotSeparator />
                        <span className="truncate">{report.reporterLabel}</span>
                      </span>
                    </span>
                  }
                  trailing={report.unread ? <span role="img" aria-label="" className="size-2 rounded-full bg-primary" /> : undefined}
                  chevron
                />
              );
            })}
          </Group>
        )}
      </ScreenBody>
    </div>
  );
};