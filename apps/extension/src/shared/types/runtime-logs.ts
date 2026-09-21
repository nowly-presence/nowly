export type RuntimeLogLevel = "info" | "success" | "warn" | "error"

export type RuntimeLogType = "api" | "presence" | "native" | "settings"

export type RuntimeLogEntry = {
  id: string
  at: number
  level: RuntimeLogLevel
  type: RuntimeLogType
  message: string
  payload?: Record<string, string | number | boolean | null>
}
