import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import { REPORT_POLL_MS, type StaffReportCounts, type StaffReportFilter, type StaffReportSummary } from "@/shared/reports";

export const useStaffReportList = (enabled: boolean, filter: StaffReportFilter) => {
  const [reports, setReports] = useState<StaffReportSummary[] | null>(null);
  const [counts, setCounts] = useState<StaffReportCounts>({
    new: 0,
    awaitingReporter: 0
  });
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    const result = await sendMessage("ADMIN_REPORT_LIST", { filter }).catch(() => null);

    if (!result?.ok) {
      setError(true);
      return;
    }

    setError(false);
    setReports(result.reports);
    setCounts(result.counts);
  }, [filter]);

  useEffect(() => {
    if (!enabled) return;

    setReports(null);
    void reload();
    const timer = window.setInterval(() => void reload(), REPORT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, reload]);

  return { reports, counts, error, reload };
};