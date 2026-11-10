import type { PayloadOf, ResponseOf, RouterMessageType, RouterRequest } from "@/background/router/contracts";
import { isAllowedWebSender } from "@/shared/web-origin";
import { getEffectiveWebUrl } from "@/background/services/api-state";
import { isWebRouterMessageType } from "@/shared/web-bridge-routing";

export type Handler<K extends RouterMessageType> = (payload: PayloadOf<K>, sender: chrome.runtime.MessageSender) => ResponseOf<K> | Promise<ResponseOf<K>>;

export type HandlerRegistry = { [K in RouterMessageType]: Handler<K> };

export const registerRouter = (handlers: HandlerRegistry): void => {
  chrome.runtime.onMessage.addListener((message: RouterRequest, sender, sendResponse) => {
    if (message.source !== "PRESENCES_POPUP" && message.source !== "PRESENCES_CONTENT") return false;
    if (
      message.source === "PRESENCES_CONTENT" &&
      (!isWebRouterMessageType(message.type) || !isAllowedWebSender(sender.url, getEffectiveWebUrl(), message.type))
    ) return false;
    if (message.source === "PRESENCES_POPUP" && (!sender.url || !sender.url.startsWith(chrome.runtime.getURL("")))) return false;
    if (!Object.hasOwn(handlers, message.type)) return false;

    const handler = handlers[message.type] as Handler<RouterMessageType> | undefined;

    if (!handler) return false;

    Promise.resolve(handler(message.payload, sender)).then(sendResponse);
    return true;
  });
};