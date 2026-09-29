import { createAnalyticsClient, type TrackInput } from "@nowly/analytics"
import { getEffectiveApiUrl } from "@/background/services/api-state"
import { getActiveDeviceId } from "@/background/services/device-sync"
import { getAnalyticsConsent } from "@/background/storage/device.store"

const client = createAnalyticsClient({
  transport: {
    send: async (events) => {
      const response = await fetch(`${getEffectiveApiUrl()}/insights/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      })
      if (!response.ok) throw new Error(`analytics transport failed: ${response.status}`)
    },
  },
  consent: {
    get: async () => ((await getAnalyticsConsent()) ? "granted" : "denied"),
  },
  identity: {
    getDeviceId: () => getActiveDeviceId(),
  },
  flushAt: 1,
})

export const trackAnalytics = (key: string, input: TrackInput = {}): void => {
  void client.track(key, input).catch(() => {
  })
}
