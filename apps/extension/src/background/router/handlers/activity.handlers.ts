import { handleActivityUpdate, handleClearActivity } from "@/background/managers/activity-manager"
import { setPresencePaused } from "@/background/managers/presence-pause"
import type { Handler } from "@/background/router/router"
import { getCurrentActivity, getDebug, setDebug } from "@/background/storage/presences.store"

export const handleGetCurrentActivity: Handler<"GET_CURRENT_ACTIVITY"> = () => getCurrentActivity()

export const handleGetDebug: Handler<"GET_DEBUG"> = () => getDebug()

export const handleDebug: Handler<"DEBUG"> = async (payload) => {
  await setDebug(payload)
  return { ok: true }
}

export const handleActivityUpdateMessage: Handler<"ACTIVITY_UPDATE"> = ({ slug, activity }, sender) =>
  handleActivityUpdate(slug, activity, sender.tab?.id)

export const handleClearActivityMessage: Handler<"CLEAR_ACTIVITY"> = () => handleClearActivity()

export const handleSetPresencePause: Handler<"SET_PRESENCE_PAUSE"> = ({ paused }) => setPresencePaused(paused)
