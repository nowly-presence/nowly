import type { RuntimeLogEntry, RuntimeLogLevel, RuntimeLogType } from "@/shared/types"

const MAX_LOGS = 500
const forbiddenPayloadKeys = new Set([
  "url",
  "href",
  "title",
  "query",
  "search",
  "content",
  "channel",
  "profile",
  "ip",
  "userAgent",
  "history",
  "discordId",
  "discordUserId",
])

const logs: RuntimeLogEntry[] = []

const sanitizeValue = (value: unknown): string | number | boolean | null | undefined => {
  if (typeof value === "string") return value.slice(0, 160)
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value
  return undefined
}

export const sanitizeLogPayload = (payload: Record<string, unknown> = {}): Record<string, string | number | boolean | null> =>
  Object.fromEntries(
    Object.entries(payload)
      .filter(([key]) => !forbiddenPayloadKeys.has(key))
      .map(([key, value]) => [key, sanitizeValue(value)])
      .filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean | null>

export const addRuntimeLog = (
  level: RuntimeLogLevel,
  type: RuntimeLogType,
  message: string,
  payload?: Record<string, unknown>,
): RuntimeLogEntry => {
  const entry: RuntimeLogEntry = {
    id: crypto.randomUUID(),
    at: Date.now(),
    level,
    type,
    message,
    payload: payload ? sanitizeLogPayload(payload) : undefined,
  }

  logs.push(entry)
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS)

  chrome.runtime.sendMessage({ source: "PRESENCES_BACKGROUND", type: "RUNTIME_LOGS_ADDED", payload: entry }).catch(() => {
    // No extension page is open.
  })

  return entry
}

export const getRuntimeLogs = (): RuntimeLogEntry[] => [...logs]

export const clearRuntimeLogs = (): void => {
  logs.splice(0, logs.length)
}
