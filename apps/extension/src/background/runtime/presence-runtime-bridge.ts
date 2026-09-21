import { handleActivityUpdate, handleClearActivity } from "@/background/managers/activity-manager"
import { USER_SCRIPT_MESSAGE_SOURCE } from "@/background/runtime/presence-runtime"
import { setDebug } from "@/background/storage/presences.store"
import type { PresenceData } from "@/shared/types"

export const registerPresenceRuntimeBridge = (): void => {
  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.source !== USER_SCRIPT_MESSAGE_SOURCE) return false

    const payload = message.payload as { slug?: string; activity?: PresenceData; stage?: string; message?: string } | undefined
    const slug = payload?.slug
    if (!slug) return false

    if (message.type === "ACTIVITY_UPDATE" && payload.activity) {
      void handleActivityUpdate(slug, payload.activity, sender.tab?.id)
    }

    if (message.type === "CLEAR_ACTIVITY") {
      void handleClearActivity(slug)
    }

    if (message.type === "DEBUG") {
      void setDebug({
        stage: payload.stage ?? "presence",
        message: `[${slug}] ${payload.message ?? "debug"}`,
        url: sender.tab?.url,
        updatedAt: Date.now(),
      })
    }

    return false
  })
}
