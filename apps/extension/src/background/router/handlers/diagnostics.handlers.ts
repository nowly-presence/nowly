import { unpackedUserScriptsStatus } from "@/background/router/handlers/native.handlers"
import type { Handler } from "@/background/router/router"
import { refreshNativeStatus } from "@/background/services/native"
import { getCurrentActivity, getPresences } from "@/background/storage/presences.store"
import { visiblePresences } from "@/background/runtime/user-scripts"

export const handleGetDiagnostic: Handler<"GET_DIAGNOSTIC"> = async () => {
  const [presences, activity] = await Promise.all([getPresences(), getCurrentActivity()])
  const userScripts = unpackedUserScriptsStatus()
  const nativeStatus = refreshNativeStatus()
  const visible = visiblePresences(presences)

  return {
    extensionInstalled: true,
    userScriptsActive: userScripts.enabled,
    hostDetected: Boolean(nativeStatus.connected || nativeStatus.discordConnected),
    discordConnected: Boolean(nativeStatus.discordConnected),
    presenceInstalled: Object.keys(visible).length > 0,
    activityDetected: Boolean(activity),
  }
}
