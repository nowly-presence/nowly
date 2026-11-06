import { ReportStatusBadge } from "@/components/shared/report-status-badge";
import { BackHeader, ScreenBody } from "@/components/shared/screen";
import { useExtensionState } from "@/hooks/extension-state-provider";
import { useI18n } from "@/hooks/i18n-provider";
import { useNav } from "@/hooks/navigation-provider";
import { readableName } from "@/lib/readable-name";
import { Skeleton } from "@/ui/skeleton";
import { useToast } from "@/ui/toast";
import { AdminReportComposer } from "@/features/admin/admin-report-composer";
import { useAdminReportThread, type StaffSend } from "@/features/admin/use-admin-report-thread";
import { ReportThreadView } from "@/features/reports/report-thread-view";

export const AdminReportView = ({ id }: {
  id: string;
}) => {
  const { t } = useI18n();
  const { pop } = useNav();
  const { toast } = useToast();
  const { state } = useExtensionState();
  const { report, error, busy, send } = useAdminReportThread(id);
  const self = state.account.signedIn ? state.account.user : null;

  const submit = async (input: StaffSend): Promise<boolean> => {
    const sent = await send(input);

    if (!sent) toast(t("report.sendError"), "error");

    return sent;
  };

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader
        title={report ? `${readableName(report.slug)}, ${report.reporterLabel}` : undefined}
        onBack={pop}
        backLabel={t("action.back")}
        action={report && <ReportStatusBadge status={report.status} />}
      />
      <ScreenBody className="flex-1 pt-2 pb-4!">
        {!report && !error && <Skeleton className="h-40" />}
        {error && !report && <p className="px-1 text-label-md text-danger">{t("report.loadError")}</p>}
        {report && (
          <>
            <ReportThreadView messages={report.messages} audience="staff" selfName={self?.name} />
            <div className="sticky bottom-0 mt-auto flex flex-col gap-2 bg-canvas pt-2">
              <AdminReportComposer key={report.status} status={report.status} reporterLabel={report.reporterLabel} busy={busy} onSend={submit} />
            </div>
          </>
        )}
      </ScreenBody>
    </div>
  );
};