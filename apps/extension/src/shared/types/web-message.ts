// External protocol between nowly.me and the content script (window.postMessage),
// distinct from the internal background router's RouterMessageMap.
export type WebMessageType =
  | "INSTALL_PRESENCE"
  | "UPDATE_PRESENCE"
  | "UNINSTALL_PRESENCE"
  | "GET_INSTALLED"
  | "GET_DIAGNOSTIC"
  | "GET_DEVICE_INFO"
  | "GET_ANALYTICS_CONSENT"
  | "SET_ANALYTICS_CONSENT"

export type WebMessage = {
  source: typeof import("@/shared/constants").EXT_WEB_SOURCE
  type: WebMessageType | "PING"
  payload?: unknown
  messageId?: string
}
