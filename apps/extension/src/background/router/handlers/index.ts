import type { RouterMessageType } from "@/background/router/contracts"
import type { Handler, HandlerRegistry } from "@/background/router/router"
import { handleGetSettings, handleSetSettings } from "@/background/router/handlers/settings.handlers"

// Placeholder for message types not yet ported from tmp/ (see the redesign
// plan's step 5). Each entry here gets replaced by a real handler as its
// manager is ported - the HandlerRegistry type keeps this file honest about
// what's left.
const notImplemented =
  <K extends RouterMessageType>(type: K): Handler<K> =>
  () => {
    throw new Error(`No handler registered yet for "${type}" - redesign in progress.`)
  }

export const buildHandlerRegistry = (): HandlerRegistry => ({
  GET_PRESENCES: notImplemented("GET_PRESENCES"),
  GET_NATIVE_STATUS: notImplemented("GET_NATIVE_STATUS"),
  GET_USER_SCRIPTS_STATUS: notImplemented("GET_USER_SCRIPTS_STATUS"),
  GET_DIAGNOSTIC: notImplemented("GET_DIAGNOSTIC"),
  CONNECT_NATIVE: notImplemented("CONNECT_NATIVE"),
  RESTART_NATIVE: notImplemented("RESTART_NATIVE"),
  GET_CURRENT_ACTIVITY: notImplemented("GET_CURRENT_ACTIVITY"),
  GET_DEBUG: notImplemented("GET_DEBUG"),
  TOGGLE_PRESENCE: notImplemented("TOGGLE_PRESENCE"),
  UNINSTALL_PRESENCE: notImplemented("UNINSTALL_PRESENCE"),
  ACTIVITY_UPDATE: notImplemented("ACTIVITY_UPDATE"),
  CLEAR_ACTIVITY: notImplemented("CLEAR_ACTIVITY"),
  INSTALL_PRESENCE: notImplemented("INSTALL_PRESENCE"),
  UPDATE_PRESENCE: notImplemented("UPDATE_PRESENCE"),
  INSTALL_PRESENCE_FROM_API: notImplemented("INSTALL_PRESENCE_FROM_API"),
  INSTALL_LOCAL_PRESENCE_ZIP: notImplemented("INSTALL_LOCAL_PRESENCE_ZIP"),
  FETCH_PRESENCE_CATALOG: notImplemented("FETCH_PRESENCE_CATALOG"),
  SET_PRESENCE_PAUSE: notImplemented("SET_PRESENCE_PAUSE"),
  GET_INSTALL_QUEUE: notImplemented("GET_INSTALL_QUEUE"),
  RETRY_INSTALL_QUEUE: notImplemented("RETRY_INSTALL_QUEUE"),
  CHECK_UPDATES: notImplemented("CHECK_UPDATES"),
  GET_SETTINGS: handleGetSettings,
  SET_SETTINGS: handleSetSettings,
  GET_ANALYTICS_CONSENT: notImplemented("GET_ANALYTICS_CONSENT"),
  SET_ANALYTICS_CONSENT: notImplemented("SET_ANALYTICS_CONSENT"),
  RESET_ONBOARDING_FOR_DEV: notImplemented("RESET_ONBOARDING_FOR_DEV"),
  GET_PRESENCE_SETTINGS: notImplemented("GET_PRESENCE_SETTINGS"),
  SET_PRESENCE_SETTINGS: notImplemented("SET_PRESENCE_SETTINGS"),
  SNOOZE_PRESENCE: notImplemented("SNOOZE_PRESENCE"),
  CLEAR_SNOOZE: notImplemented("CLEAR_SNOOZE"),
  SET_PRESENCE_SCHEDULE: notImplemented("SET_PRESENCE_SCHEDULE"),
  GET_RUNTIME_LOGS: notImplemented("GET_RUNTIME_LOGS"),
  CLEAR_RUNTIME_LOGS: notImplemented("CLEAR_RUNTIME_LOGS"),
  TRACK_EVENT: notImplemented("TRACK_EVENT"),
  DEBUG: notImplemented("DEBUG"),
})
