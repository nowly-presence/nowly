import { trackAnalytics } from "@/background/analytics-client"
import { addRuntimeLog } from "@/background/runtime-logs"
import { getEffectiveApiUrl } from "@/background/services/api-state"
import { getActiveDeviceId, syncDeviceState } from "@/background/services/device-sync"
import { getPresences } from "@/background/storage/presences.store"

export const sendActiveHeartbeat = async (slugs: string[]): Promise<void> => {
  if (slugs.length === 0) return
  const deviceId = await getActiveDeviceId()
  addRuntimeLog("info", "api", "POST /presences/active", { count: slugs.length })
  const presences = await getPresences()
  for (const slug of slugs) {
    const stored = presences[slug]
    trackAnalytics("presence_active_heartbeat", {
      slug,
      version: stored?.release?.version ?? stored?.metadata?.version,
      source: "extension_library",
    })
  }
  try {
    const response = await fetch(`${getEffectiveApiUrl()}/presences/active`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presences: slugs, deviceId }),
    })
    addRuntimeLog(response.ok ? "success" : "warn", "api", "POST /presences/active result", {
      status: response.status,
      count: slugs.length,
    })
  } catch (error) {
    addRuntimeLog("error", "api", "POST /presences/active failed", { error: error instanceof Error ? error.message : String(error) })
  }
  void syncDeviceState()
}
