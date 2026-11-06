import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import { REPORT_POLL_MS, type ReportSummary } from "@/shared/reports";

export const useReportList = () => {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const result = await sendMessage("REPORT_LIST").catch(() => null);

    if (result?.ok) setReports(result.reports);

    setLoaded(true);
  }, []);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), REPORT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  return { reports, loaded, reload };
};