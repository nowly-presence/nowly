import type { PayloadOf, ResponseOf, RouterMessageType, RouterRequest } from "@/background/router/contracts"

export type Handler<K extends RouterMessageType> = (
  payload: PayloadOf<K>,
  sender: chrome.runtime.MessageSender,
) => ResponseOf<K> | Promise<ResponseOf<K>>

export type HandlerRegistry = { [K in RouterMessageType]: Handler<K> }

let handlers: HandlerRegistry | null = null

// Called once at startup with a fully-built registry - the HandlerRegistry
// mapped type forces every RouterMessageMap key to have an implementation,
// so a forgotten handler is a compile error, not a silent `default:` fallthrough.
export const registerHandlers = (registry: HandlerRegistry): void => {
  handlers = registry
}

export const registerRouter = (): void => {
  chrome.runtime.onMessage.addListener((message: RouterRequest, sender, sendResponse) => {
    if (message.source !== "PRESENCES_POPUP" && message.source !== "PRESENCES_CONTENT") return false
    if (!handlers) return false

    const handler = handlers[message.type] as Handler<RouterMessageType> | undefined
    if (!handler) return false

    // Returning true keeps Chrome's response channel open while handlers await storage,
    // network, or native-host operations.
    Promise.resolve(handler(message.payload, sender)).then(sendResponse)
    return true
  })
}
