import { trackAnalytics } from "@/background/analytics-client"
import { clearRuntimeLogs, getRuntimeLogs } from "@/background/runtime-logs"
import type { Handler } from "@/background/router/router"
import { getAnalyticsConsent, setAnalyticsConsent } from "@/background/storage/device.store"

export const handleGetAnalyticsConsent: Handler<"GET_ANALYTICS_CONSENT"> = async () => ({ granted: await getAnalyticsConsent() })

export const handleSetAnalyticsConsent: Handler<"SET_ANALYTICS_CONSENT"> = async ({ granted }) => {
  const next = await setAnalyticsConsent(granted)
  // Only the acceptance itself is worth recording - a decline must not send
  // anything (consent is denied by the time this resolves, so the client's
  // own gate would drop it anyway).
  if (next) trackAnalytics("analytics_consent_accepted", { source: "extension_settings" })
  return { granted: next }
}

export const handleTrackEvent: Handler<"TRACK_EVENT"> = ({ key, ...input }) => {
  trackAnalytics(key, input)
  return { ok: true }
}

export const handleGetRuntimeLogs: Handler<"GET_RUNTIME_LOGS"> = () => getRuntimeLogs()

export const handleClearRuntimeLogs: Handler<"CLEAR_RUNTIME_LOGS"> = () => {
  clearRuntimeLogs()
  return { ok: true }
}
