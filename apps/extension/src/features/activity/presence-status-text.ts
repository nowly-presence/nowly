import type { Translate } from "@/hooks/i18n-provider"
import { formatTime, hostnameOf } from "@/lib/format"
import type { PresenceStatus } from "@/lib/presence-status"
import type { Locale } from "@/shared/locales"
import type { StoredPresence } from "@/shared/types"

export type StatusTone = "success" | "muted" | "primary"
export type StatusLine = { text: string; tone: StatusTone }

export const toneClass: Record<StatusTone, string> = { success: "text-success", muted: "text-muted", primary: "text-primary" }

export const statusText = (status: PresenceStatus, stored: StoredPresence, t: Translate, locale: Locale): StatusLine => {
  switch (status.kind) {
    case "live":
      return { text: t("status.live"), tone: "success" }
    case "detected":
      return { text: t("status.detected"), tone: "primary" }
    case "off":
      return { text: t("status.off"), tone: "muted" }
    case "snoozed":
      return { text: t("status.snoozedUntil", { time: formatTime(status.until, locale) }), tone: "muted" }
    case "schedule":
      return { text: t("status.schedule"), tone: "muted" }
    case "paused":
      return { text: t("status.paused"), tone: "muted" }
    default:
      return { text: stored.metadata.url?.[0] ? hostnameOf(stored.metadata.url[0]) : t("status.ready"), tone: "muted" }
  }
}

