import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { useStaffAccess } from "@/hooks/use-staff-access";
import { useStaffReportList } from "@/hooks/use-staff-report-list";
import { Group } from "@/ui/card";
import { Row } from "@/ui/row";
import { Section } from "@/ui/section";

export const StaffReportsSection = () => {
  const { t } = useI18n();
  const { push } = useNav();
  const staff = useStaffAccess();
  const reviewing = staff.can("review");
  const { counts } = useStaffReportList(reviewing, "todo");
  const total = counts.new + counts.awaitingReporter;

  if (!reviewing || total === 0) return null;

  return (
    <Section title={t("report.staff.title")}>
      <Group>
        <Row
          onClick={() => push({ name: "admin-reports" })}
          leading={
            <span className="flex size-9 items-center justify-center rounded-sm bg-primary-soft text-label-lg font-medium text-primary">{counts.new}</span>
          }
          title={t("report.staff.pending")}
          description={t("report.staff.pendingHint", {
            new: counts.new,
            waiting: counts.awaitingReporter
          })}
          chevron
        />
      </Group>
    </Section>
  );
};