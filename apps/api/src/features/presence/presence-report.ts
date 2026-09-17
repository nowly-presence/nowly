import { serverEnv } from "@nowly/env/server"
import type { PresenceMeta } from "./presence.types"

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export const sanitizeReportMessage = (message: string): string =>
  message.replace(CONTROL_CHARS, "").trim()

const localizedName = (value: unknown, locale: string | undefined, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (value && typeof value === "object") {
    const localized = value as Record<string, unknown>
    const candidates = [
      locale,
      locale?.replace("_", "-"),
      "en-US",
      "en",
    ]
    for (const key of candidates) {
      if (!key) continue
      const match = localized[key]
      if (typeof match === "string" && match.trim()) return match.trim()
    }
    const first = Object.values(localized).find((entry) => typeof entry === "string" && entry.trim())
    if (typeof first === "string") return first.trim()
  }
  return fallback
}

export const presenceDisplayName = (meta: PresenceMeta | null, slug: string, locale?: string): string =>
  localizedName(meta?.name, locale, slug)

export const submitPresenceReport = async (input: {
  slug: string
  name: string
  message: string
  locale?: string
}): Promise<"sent" | "unconfigured" | "failed"> => {
  const webhookUrl = serverEnv.DISCORD_WEBHOOK_REPORT_URL
  if (!webhookUrl) return "unconfigured"

  const site = serverEnv.FRONTEND_URL.replace(/\/$/, "")
  const pageUrl = `${site}/library/${encodeURIComponent(input.slug)}`
  const reportedAt = new Date().toISOString()

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "Presence issue report",
            color: 0xf59e0b,
            timestamp: reportedAt,
            fields: [
              {
                name: "Presence",
                value: `[${input.name}](${pageUrl})`,
                inline: true,
              },
              {
                name: "Slug",
                value: `\`${input.slug}\``,
                inline: true,
              },
              ...(input.locale
                ? [{ name: "Locale", value: input.locale, inline: true }]
                : []),
              {
                name: "Reported at",
                value: `<t:${Math.floor(Date.parse(reportedAt) / 1000)}:F>`,
                inline: false,
              },
              {
                name: "Problem",
                value: input.message.slice(0, 1024),
                inline: false,
              },
            ],
            footer: { text: "nowly.me library" },
          },
        ],
      }),
    })

    if (!response.ok) return "failed"
    return "sent"
  } catch {
    return "failed"
  }
}
