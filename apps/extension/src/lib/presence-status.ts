import type { ExtensionSettings, PresenceSchedule, StoredPresence } from "@/shared/types"

export type PresenceStatus =
  | { kind: "live" }
  | { kind: "detected" }
  | { kind: "ready" }
  | { kind: "off" }
  | { kind: "snoozed"; until: number }
  | { kind: "schedule" }
  | { kind: "paused" }

export const isOutsideSchedule = (schedule: PresenceSchedule | undefined, now = new Date()): boolean => {
  if (!schedule) return false
  if (!schedule.days.includes(now.getDay())) return true
  if (schedule.start && schedule.end) {
    const minutes = now.getHours() * 60 + now.getMinutes()
    const [startH, startM] = schedule.start.split(":").map(Number)
    const [endH, endM] = schedule.end.split(":").map(Number)
    if (minutes < startH * 60 + startM || minutes > endH * 60 + endM) return true
  }
  return false
}

export const presenceStatus = (
  slug: string,
  stored: StoredPresence,
  settings: ExtensionSettings,
  context: { liveSlug?: string | null; detectedSlugs: Set<string>; now?: number },
): PresenceStatus => {
  const now = context.now ?? Date.now()
  if (!stored.enabled) return { kind: "off" }
  if (stored.snoozeUntil && stored.snoozeUntil > now) return { kind: "snoozed", until: stored.snoozeUntil }
  if (settings.presencePaused) return { kind: "paused" }
  if (settings.scheduleEnabled !== false && isOutsideSchedule(stored.schedule ?? settings.globalSchedule, new Date(now))) {
    return { kind: "schedule" }
  }
  if (context.liveSlug === slug) return { kind: "live" }
  if (context.detectedSlugs.has(slug)) return { kind: "detected" }
  return { kind: "ready" }
}

export type Connection = "discord" | "no-discord" | "no-host" | "connecting"

export const connectionOf = (native: { connected: boolean; discordConnected?: boolean; status: string }): Connection => {
  if (native.discordConnected) return "discord"
  if (native.connected) return "no-discord"
  if (native.status === "connecting") return "connecting"
  return "no-host"
}
