import { EXT_WEB_SOURCE, WEB_BASE_URL } from "@/shared/constants"
import type { WebMessage } from "@/shared/types"

const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE"
const IS_UNPACKED = !chrome.runtime.getManifest().update_url
const DEVICE_KEY = "deviceId"
const DEVICE_TOKEN_KEY = "deviceToken"
let MARKETPLACE_ORIGIN = new URL(WEB_BASE_URL).origin

const isAllowedWebOrigin = (origin: string): boolean => {
  if (IS_UNPACKED) {
    return origin === MARKETPLACE_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin)
  }
  return origin === MARKETPLACE_ORIGIN
}

const WEB_MESSAGE_TYPES = new Set([
  "INSTALL_PRESENCE",
  "UPDATE_PRESENCE",
  "UNINSTALL_PRESENCE",
  "GET_INSTALLED",
  "GET_DIAGNOSTIC",
  "GET_DEVICE_INFO",
  "GET_ANALYTICS_CONSENT",
  "SET_ANALYTICS_CONSENT",
])

// The external web protocol keeps its own message names (a stable contract
// with nowly.me) - only "GET_INSTALLED" doesn't match the internal router's
// vocabulary (GET_PRESENCES), so it's translated at the boundary.
const toRouterMessageType = (type: string): string => (type === "GET_INSTALLED" ? "GET_PRESENCES" : type)

const sendRuntimeMessage = async <T = unknown>(message: Record<string, unknown>): Promise<T | null> => {
  try {
    return await chrome.runtime.sendMessage(message)
  } catch {
    return null
  }
}

const getDeviceId = async (): Promise<string> => {
  const result = await chrome.storage.local.get(DEVICE_KEY)
  if (result[DEVICE_KEY]) return result[DEVICE_KEY] as string
  const id = crypto.randomUUID()
  await chrome.storage.local.set({ [DEVICE_KEY]: id })
  return id
}

const broadcastDetected = (): void => {
  let count = 0
  const interval = window.setInterval(() => {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "EXT_DETECTED" }, "*")
    count += 1
    if (count >= 10) window.clearInterval(interval)
  }, 300)
}

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (!isAllowedWebOrigin(event.origin)) return

  if (event.data?.source === EXT_WEB_SOURCE && event.data.type === "PING") {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "EXT_DETECTED" }, "*")
  }
})

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (!isAllowedWebOrigin(event.origin)) return
  if (event.data?.source !== EXT_WEB_SOURCE || event.data.type === "PING") return
  if (!WEB_MESSAGE_TYPES.has(event.data.type)) return

  const msg = event.data
  if (!msg.messageId) return

  if (msg.type === "GET_DEVICE_INFO") {
    Promise.all([getDeviceId(), chrome.storage.local.get(DEVICE_TOKEN_KEY)]).then(([deviceId, tokenResult]) => {
      const deviceToken = (tokenResult[DEVICE_TOKEN_KEY] as string | undefined) ?? null
      window.postMessage({ source: EXT_WEB_SOURCE, type: "DEVICE_INFO", payload: { deviceId, deviceToken }, messageId: msg.messageId }, "*")
    })
    return
  }

  sendRuntimeMessage({
    source: "PRESENCES_CONTENT",
    type: toRouterMessageType(msg.type),
    payload: msg.payload,
  }).then((response) => {
    window.postMessage(
      {
        source: EXT_WEB_SOURCE,
        type: msg.type === "GET_INSTALLED" ? "INSTALLED_PRESENCES" : `${msg.type}_RESULT`,
        payload: response ?? { ok: false, error: "BACKGROUND_UNAVAILABLE" },
        messageId: msg.messageId,
      },
      "*",
    )
  })
})

window.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.source !== USER_SCRIPT_MESSAGE_SOURCE) return

  void sendRuntimeMessage({
    source: USER_SCRIPT_MESSAGE_SOURCE,
    type: event.data.type,
    payload: event.data.payload,
  })
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "UPDATE_MARKETPLACE_ORIGIN" && typeof message.origin === "string") {
    MARKETPLACE_ORIGIN = message.origin
  }

  if (message?.type === "PRESENCE_SETTINGS_UPDATED") {
    window.postMessage(
      { source: "NOWLY_HOST", type: "SETTINGS_UPDATED", slug: message.slug, settings: message.settings, strings: message.strings },
      "*",
    )
  }
})

broadcastDetected()
