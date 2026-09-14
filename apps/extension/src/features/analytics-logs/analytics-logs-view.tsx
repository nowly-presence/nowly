import { sendMessage } from "@/lib/messages";
import { t } from "@/shared/i18n";
import type { AnalyticsLogEntry } from "@/shared/types";
import type { FC, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnalyticsLogFilterTabs } from "@/features/analytics-logs/analytics-log-filter-tabs";
import { AnalyticsLogRow } from "@/features/analytics-logs/analytics-log-row";
import { AnalyticsLogToolbar } from "@/features/analytics-logs/analytics-log-toolbar";
import type { AnalyticsLogFeedback, AnalyticsLogFilter } from "@/features/analytics-logs/analytics-logs.model";

export const AnalyticsLogsView: FC = (): ReactElement => {
  const [logs, setLogs] = useState<AnalyticsLogEntry[]>([]);
  const [filter, setFilter] = useState<AnalyticsLogFilter>("all");
  const [feedback, setFeedback] = useState<AnalyticsLogFeedback>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void sendMessage<AnalyticsLogEntry[]>("GET_ANALYTICS_LOGS").then((entries) => {
      setLogs(entries ?? []);
    });

    const onRuntimeMessage = (message: Record<string, unknown>): void => {
      if (message.source !== "PRESENCES_BACKGROUND" || message.type !== "ANALYTICS_LOG_ADDED") return;
      const entry = message.payload as AnalyticsLogEntry | undefined;
      if (!entry?.id) return;
      setLogs((current) => [...current, entry].slice(-500));
    };

    chrome.runtime.onMessage.addListener(onRuntimeMessage);
    return () => chrome.runtime.onMessage.removeListener(onRuntimeMessage);
  }, []);

  useEffect(() => () => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
  }, []);

  const visibleLogs = useMemo(
    () => logs.filter((log) => filter === "all" || log.type === filter).slice().reverse(),
    [filter, logs],
  );

  const showFeedback = useCallback((nextFeedback: Exclude<AnalyticsLogFeedback, null>): void => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current);
    setFeedback(nextFeedback);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 1400);
  }, []);

  const clearLogs = useCallback((): void => {
    void sendMessage<{ ok: boolean }>("CLEAR_ANALYTICS_LOGS").then(() => {
      setLogs([]);
      showFeedback("cleared");
    });
  }, [showFeedback]);

  const copyLogs = useCallback((): void => {
    if (!navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(JSON.stringify(visibleLogs, null, 2)).then(() => showFeedback("copied"));
  }, [showFeedback, visibleLogs]);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <AnalyticsLogToolbar
        clearConfirmed={feedback === "cleared"}
        copyConfirmed={feedback === "copied"}
        onClear={clearLogs}
        onCopy={copyLogs}
      />

      <AnalyticsLogFilterTabs filter={filter} onFilterChange={setFilter} />

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
        {visibleLogs.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center p-6 text-center text-xs text-muted-foreground">
            {t("analytics-logs-empty")}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleLogs.map((log) => (
              <AnalyticsLogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};