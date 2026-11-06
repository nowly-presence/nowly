import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import { REPORT_POLL_MS, type ReportStatus, type StaffReportDetail } from "@/shared/reports";

export type StaffSend = {
  message: string;
  visibility: "public" | "internal";
  statusTo?: ReportStatus;
  choices?: string[];
};

export const useAdminReportThread = (id: string) => {
  const [report, setReport] = useState<StaffReportDetail | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const result = await sendMessage("ADMIN_REPORT_THREAD", { id }).catch(() => null);

    if (!result?.ok) {
      setError(true);
      return;
    }

    setError(false);
    setReport(result.report);
  }, [id]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), REPORT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const send = useCallback(async (input: StaffSend): Promise<boolean> => {
    setBusy(true);
    const result = await sendMessage("ADMIN_REPORT_SEND", { id, ...input }).catch(() => null);
    setBusy(false);

    if (!result?.ok) return false;

    await reload();
    return true;
  }, [id, reload]);

  const assign = useCallback(async (assigneeId: string | null): Promise<boolean> => {
    setBusy(true);
    const result = await sendMessage("ADMIN_REPORT_ASSIGN", { id, assigneeId }).catch(() => null);
    setBusy(false);

    if (!result?.ok) return false;

    await reload();
    return true;
  }, [id, reload]);

  return { report, error, busy, send, assign };
};