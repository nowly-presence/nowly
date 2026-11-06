import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "@/lib/messages";
import { REPORT_POLL_MS, type ReportMessage, type ReportSummary } from "@/shared/reports";

export const useReportThread = (id: string) => {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const result = await sendMessage("REPORT_THREAD", { id }).catch(() => null);

    if (!result?.ok) {
      setError(true);
      return;
    }

    setError(false);
    setReport(result.report);
    setMessages(result.messages);
  }, [id]);

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), REPORT_POLL_MS);
    return () => window.clearInterval(timer);
  }, [reload]);

  const reply = useCallback(async (message: string, answerTo?: string): Promise<boolean> => {
    setBusy(true);
    const result = await sendMessage("REPORT_REPLY", { id, message, answerTo }).catch(() => null);
    setBusy(false);

    if (!result?.ok) return false;

    setMessages(result.messages);
    void reload();
    return true;
  }, [id, reload]);

  const setClosed = useCallback(async (closed: boolean): Promise<boolean> => {
    setBusy(true);
    const result = await sendMessage("REPORT_SET_CLOSED", { id, closed }).catch(() => null);
    setBusy(false);

    if (!result?.ok) return false;

    await reload();
    return true;
  }, [id, reload]);

  return { report, messages, error, busy, reply, setClosed };
};