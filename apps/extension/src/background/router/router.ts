import type { PayloadOf, ResponseOf, RouterMessageType, RouterRequest } from "@/background/router/contracts";
import { isAllowedWebSender } from "@/shared/web-origin";
import { getEffectiveWebUrl } from "@/background/services/api-state";
import { registerCustomActivityEditors } from "@/background/services/custom-activity-editors";

const WEB_TYPES = new Set([
  "GET_ACTIVITY_PUBLICATION_STATUS",
  "APPLY_ACTIVITY_PUBLICATION",
  "INSTALL_PRESENCE",
  "UPDATE_PRESENCE",
  "UNINSTALL_PRESENCE",
  "GET_PRESENCES",
  "GET_DIAGNOSTIC",
  "GET_ANALYTICS_CONSENT",
  "SET_ANALYTICS_CONSENT",
  "NOWLY_SESSION"
]);

export type Handler<K extends RouterMessageType> = (payload: PayloadOf<K>, sender: chrome.runtime.MessageSender) => ResponseOf<K> | Promise<ResponseOf<K>>;

export type HandlerRegistry = { [K in RouterMessageType]: Handler<K> };

let handlers: HandlerRegistry | null = null;

export const registerHandlers = (registry: HandlerRegistry): void => {
  handlers = registry;
};

export const registerRouter = (): void => {
  registerCustomActivityEditors();
  chrome.runtime.onMessage.addListener((message: RouterRequest, sender, sendResponse) => {
    if (message.source !== "PRESENCES_POPUP" && message.source !== "PRESENCES_CONTENT") return false;
    if (message.source === "PRESENCES_CONTENT" && (!WEB_TYPES.has(message.type) || !isAllowedWebSender(sender.url, getEffectiveWebUrl()))) return false;
    if (message.source === "PRESENCES_POPUP" && (!sender.url || !sender.url.startsWith(chrome.runtime.getURL("")))) return false;
    if (!handlers) return false;

    const handler = handlers[message.type] as Handler<RouterMessageType> | undefined;

    if (!handler) return false;

    Promise.resolve(handler(message.payload, sender)).then(sendResponse);
    return true;
  });
};