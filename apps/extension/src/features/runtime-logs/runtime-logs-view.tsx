import { useEffect, useMemo, useState } from "react"
import { RiDeleteBin6Line, RiFileCopyLine } from "@remixicon/react"
import type { RuntimeLogEntry, RuntimeLogType } from "@/shared/types"
import { Chip } from "@/ui/chip"
import { HScroll } from "@/ui/horizontal-scroller"
import { BackHeader, ScreenBody } from "@/components/shared/screen"
import { Card } from "@/ui/card"
import { EmptyState } from "@/ui/empty-state"
import { useToast } from "@/ui/toast"
import { cn } from "@/ui/cn"
import { useI18n } from "@/hooks/i18n-provider"
import { sendMessage } from "@/lib/messages"
import { useNav } from "@/hooks/navigation-provider"
import { LOCALE_LONG_MAP } from "@/shared/locales"

const levelDot: Record<RuntimeLogEntry["level"], string> = {
  info: "bg-line-strong",
  success: "bg-success",
  warn: "bg-muted",
  error: "bg-danger",
}

const MAX_LOGS = 500

export const RuntimeLogsView = () => {
  const { t, locale } = useI18n()
  const { pop } = useNav()
  const { toast } = useToast()
  const [logs, setLogs] = useState<RuntimeLogEntry[]>([])
  const [filter, setFilter] = useState<RuntimeLogType | "all">("all")

  useEffect(() => {
    void sendMessage("GET_RUNTIME_LOGS").then(setLogs).catch(() => {})
    const onMessage = (message: { source?: string; type?: string; payload?: RuntimeLogEntry }) => {
      const entry = message?.payload
      if (message?.source !== "PRESENCES_BACKGROUND" || message.type !== "RUNTIME_LOGS_ADDED" || !entry) return
      setLogs((current) => [...current.slice(-(MAX_LOGS - 1)), entry])
    }
    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  const visible = useMemo(() => [...logs].reverse().filter((entry) => filter === "all" || entry.type === filter), [logs, filter])
  const time = (at: number) => new Intl.DateTimeFormat(LOCALE_LONG_MAP[locale], { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(at)

  const copy = async () => {
    const text = visible.map((entry) => `${new Date(entry.at).toISOString()} [${entry.level}] ${entry.type}: ${entry.message} ${entry.payload ? JSON.stringify(entry.payload) : ""}`).join("\n")
    await navigator.clipboard.writeText(text)
    toast(t("toast.copied"))
  }

  return (
    <div className="flex min-h-full flex-col">
      <BackHeader
        title={t("logs.title")}
        onBack={pop}
        backLabel={t("action.back")}
        action={
          <div className="flex">
            <button type="button" aria-label={t("logs.copy")} title={t("logs.copy")} onClick={() => void copy()} className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink">
              <RiFileCopyLine className="size-[18px]" />
            </button>
            <button
              type="button"
              aria-label={t("logs.clear")}
              title={t("logs.clear")}
              onClick={() => void sendMessage("CLEAR_RUNTIME_LOGS").then(() => setLogs([]))}
              className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink"
            >
              <RiDeleteBin6Line className="size-[18px]" />
            </button>
          </div>
        }
      />
      <ScreenBody className="gap-3 pt-1">
        <HScroll className="gap-1.5">
          {(["all", "presence", "native", "api", "settings"] as const).map((value) => (
            <Chip key={value} active={filter === value} onClick={() => setFilter(value)}>
              {t(`logs.filter.${value}`)}
            </Chip>
          ))}
        </HScroll>
        {visible.length === 0 ? (
          <Card>
            <EmptyState title={t("logs.empty")} description={t("logs.emptyHint")} />
          </Card>
        ) : (
          <Card className="divide-y divide-line overflow-hidden font-mono">
            {visible.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-1 px-3 py-2.5">
                <div className="flex items-center gap-2 text-label-sm">
                  <span className={cn("size-1.5 shrink-0 rounded-full", levelDot[entry.level])} />
                  <span className="text-muted tabular-nums">{time(entry.at)}</span>
                  <span className="rounded-full bg-hover px-1.5 py-px text-muted">{entry.type}</span>
                </div>
                <span className={cn("font-sans text-label-md", entry.level === "error" ? "text-danger" : "text-ink")}>{entry.message}</span>
                {entry.payload && Object.keys(entry.payload).length > 0 && (
                  <span className="text-[11px] leading-4 break-all text-muted">
                    {Object.entries(entry.payload)
                      .map(([key, value]) => `${key}=${value}`)
                      .join("  ")}
                  </span>
                )}
              </div>
            ))}
          </Card>
        )}
      </ScreenBody>
    </div>
  )
}
