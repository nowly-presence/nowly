import type { RuntimeLogLevel, RuntimeLogType } from "@/shared/types"

export type RuntimeLogFilter = "all" | RuntimeLogType
export type RuntimeLogFeedback = "copied" | "cleared" | null

export const filters: RuntimeLogFilter[] = ["all", "api", "presence", "native", "settings"]

export const levelClass: Record<RuntimeLogLevel, string> = {
  info: "border-border bg-secondary text-muted-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warn: "border-warning/30 bg-warning/10 text-warning",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
}

export const formatTime = (timestamp: number): string => new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(timestamp))
