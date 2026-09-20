import { RiCheckLine, RiDeleteBinLine, RiFileCopyLine } from "@remixicon/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { filters, formatTime, levelClass, type RuntimeLogFeedback, type RuntimeLogFilter } from "@/features/runtime-logs/runtime-logs.model"
import { sendMessage } from "@/lib/messages"
import { t } from "@/shared/i18n"
import type { RuntimeLogEntry } from "@/shared/types"
import { Button } from "@/ui/button"
import { cn } from "@/ui/utils"

const RuntimeLogRow = ({ log }: { log: RuntimeLogEntry }): React.JSX.Element => (
  <article className="flex flex-col gap-2 p-3">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-foreground">{log.message}</p>
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{formatTime(log.at)}</span>
          <span>{log.type}</span>
        </p>
      </div>
      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", levelClass[log.level])}>{log.level}</span>
    </div>
    {log.payload ? <pre className="max-h-24 overflow-auto rounded-md bg-background p-2 text-[11px] leading-relaxed text-muted-foreground">{JSON.stringify(log.payload, null, 2)}</pre> : null}
  </article>
)

export const RuntimeLogsView = (): React.JSX.Element => {
  const [logs, setLogs] = useState<RuntimeLogEntry[]>([])
  const [filter, setFilter] = useState<RuntimeLogFilter>("all")
  const [feedback, setFeedback] = useState<RuntimeLogFeedback>(null)
  const feedbackTimerRef = useRef<number | null>(null)

  useEffect(() => {
    void sendMessage("GET_RUNTIME_LOGS").then((entries) => setLogs(entries ?? []))

    const onRuntimeMessage = (message: Record<string, unknown>): void => {
      if (message.source !== "PRESENCES_BACKGROUND" || message.type !== "RUNTIME_LOGS_ADDED") return
      const entry = message.payload as RuntimeLogEntry | undefined
      if (!entry?.id) return
      setLogs((current) => [...current, entry].slice(-500))
    }

    chrome.runtime.onMessage.addListener(onRuntimeMessage)
    return () => chrome.runtime.onMessage.removeListener(onRuntimeMessage)
  }, [])

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    },
    [],
  )

  const visibleLogs = useMemo(() => logs.filter((log) => filter === "all" || log.type === filter).slice().reverse(), [filter, logs])

  const showFeedback = useCallback((nextFeedback: Exclude<RuntimeLogFeedback, null>): void => {
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    setFeedback(nextFeedback)
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 1400)
  }, [])

  const clearLogs = useCallback((): void => {
    void sendMessage("CLEAR_RUNTIME_LOGS").then(() => {
      setLogs([])
      showFeedback("cleared")
    })
  }, [showFeedback])

  const copyLogs = useCallback((): void => {
    if (!navigator.clipboard?.writeText) return
    void navigator.clipboard.writeText(JSON.stringify(visibleLogs, null, 2)).then(() => showFeedback("copied"))
  }, [showFeedback, visibleLogs])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-end gap-1">
        <Button variant="outline" size="xs" onClick={copyLogs} title={t("runtime-logs-copy-title")} className={cn(feedback === "copied" && "border-success/40 bg-success/10 text-success")}>
          {feedback === "copied" ? <RiCheckLine /> : <RiFileCopyLine />}
          {feedback === "copied" ? t("runtime-logs-copied") : t("runtime-logs-copy-json")}
        </Button>
        <Button variant="outline" size="xs" onClick={clearLogs} title={t("runtime-logs-clear-title")} className={cn(feedback === "cleared" && "border-success/40 bg-success/10 text-success")}>
          {feedback === "cleared" ? <RiCheckLine /> : <RiDeleteBinLine />}
          {feedback === "cleared" ? t("runtime-logs-cleared") : t("runtime-logs-clear")}
        </Button>
      </div>

      <div role="tablist" className="flex gap-1 overflow-x-auto">
        {filters.map((item) => (
          <Button key={item} role="tab" aria-selected={filter === item} variant={filter === item ? "default" : "outline"} size="xs" onClick={() => setFilter(item)}>
            {item}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
        {visibleLogs.length === 0 ? (
          <div className="flex h-full min-h-48 items-center justify-center p-6 text-center text-xs text-muted-foreground">{t("runtime-logs-empty")}</div>
        ) : (
          <div className="divide-y divide-border">
            {visibleLogs.map((log) => (
              <RuntimeLogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
