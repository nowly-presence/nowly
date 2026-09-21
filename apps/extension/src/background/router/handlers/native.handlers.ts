import type { Handler } from "@/background/router/router"
import { reconnectNative, refreshNativeStatus, restartNative } from "@/background/services/native"
import type { UserScriptsStatus } from "@/shared/types"

export const handleGetNativeStatus: Handler<"GET_NATIVE_STATUS"> = () => refreshNativeStatus()

export const handleConnectNative: Handler<"CONNECT_NATIVE"> = () => reconnectNative()

export const handleRestartNative: Handler<"RESTART_NATIVE"> = () => restartNative()

export const unpackedUserScriptsStatus = (): UserScriptsStatus => {
  const available = Boolean((chrome as unknown as { userScripts?: unknown }).userScripts)
  return {
    enabled: available,
    requiresUserToggle: true,
    reason: available ? undefined : "chrome.userScripts unavailable. Enable Developer Mode / Allow User Scripts for this extension.",
  }
}

export const handleGetUserScriptsStatus: Handler<"GET_USER_SCRIPTS_STATUS"> = async () => {
  if (import.meta.env.BROWSER !== "firefox") return unpackedUserScriptsStatus()

  // userScripts is an optional permission on Firefox - reflect the actual grant state.
  const granted = await chrome.permissions.contains({ permissions: ["userScripts"] })
  return {
    enabled: granted,
    requiresUserToggle: !granted,
    reason: granted ? undefined : "userScripts permission not granted",
  }
}
