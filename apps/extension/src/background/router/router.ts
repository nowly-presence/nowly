import type { PayloadOf, ResponseOf, RouterMessageType, RouterRequest } from "@/background/router/contracts"

export type Handler<K extends RouterMessageType> = (
  payload: PayloadOf<K>,
  sender: chrome.runtime.MessageSender,
) => ResponseOf<K> | Promise<ResponseOf<K>>

export type HandlerRegistry = { [K in RouterMessageType]: Handler<K> }

let handlers: HandlerRegistry | null = null

export const registerHandlers = (registry: HandlerRegistry): void => {
  handlers = registry
}

export const registerRouter = (): void => {
  chrome.runtime.onMessage.addListener((message: RouterRequest, sender, sendResponse) => {
    if (message.source !== "PRESENCES_POPUP" && message.source !== "PRESENCES_CONTENT") return false
    if (!handlers) return false

    const handler = handlers[message.type] as Handler<RouterMessageType> | undefined
    if (!handler) return false

    Promise.resolve(handler(message.payload, sender)).then(sendResponse)
    return true
  })
}
