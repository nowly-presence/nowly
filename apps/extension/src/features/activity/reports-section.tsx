import { PresenceIcon } from "@/components/shared/presence-icon";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { readableName } from "@/lib/readable-name";
import { isReportOpen, type ReportSummary } from "@/shared/reports";
import { Group } from "@/ui/card";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";
import { ReportStatusBadge } from "@/components/shared/report-status-badge";
import { useReportList } from "@/hooks/use-report-list";

const ICON_SIZE = 36;
const PREVIEW_MAX = 80;

const UnreadDot = () => <span role="img" aria-label="" className="size-2 shrink-0 rounded-full bg-primary" />;

const preview = (report: ReportSummary, t: ReturnType<typeof useI18n>["t"]): string => {
  if (!report.lastMessage) return "";

  const text = report.lastMessage.body.replace(/\s+/g, " ").slice(0, PREVIEW_MAX);
  return t(report.lastMessage.authorRole === "staff" ? "report.lastTeam" : "report.lastYou", { text });
};

export const ReportsSection = () => {
  const { t } = useI18n();
  const { push } = useNav();
  const { reports } = useReportList();
  const open = reports.filter((report) => isReportOpen(report.status));

  if (open.length === 0) return null;

  return (
    <Section title={t("report.conversations")}>
      <Group>
        {open.map((report) => (
          <Row
            key={report.id}
            onClick={() =>
              push({
                name: "report",
                id: report.id
              })
            }
            leading={<PresenceIcon slug={report.slug} name={readableName(report.slug)} size={ICON_SIZE} />}
            title={t("report.chatTitle", { name: readableName(report.slug) })}
            description={
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate">{preview(report, t)}</span>
                <span>
                  <ReportStatusBadge status={report.status} />
                </span>
              </span>
            }
            trailing={report.unread ? <UnreadDot /> : undefined}
            chevron
          />
        ))}
      </Group>
    </Section>
  );
};