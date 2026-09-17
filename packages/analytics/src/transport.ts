import type { SanitizedPayload } from "./sanitize"

export type OutboundAnalyticsEvent = {
  eventId: string
  key: string
  deviceId?: string
  slug?: string
  version?: string
  payload: SanitizedPayload
  createdAt: string
}

export type AnalyticsTransport = {
  send: (events: OutboundAnalyticsEvent[]) => Promise<void>
}

export const createHttpTransport = (baseUrl: string, path = "/insights/events"): AnalyticsTransport => ({
  async send(events) {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    })
    if (!response.ok) {
      throw new Error(`analytics transport failed: ${response.status}`)
    }
  },
})
