import type { PayloadOf, ResponseOf, RouterMessageType } from "@/background/router/contracts"

// Typed client for the background router: the payload and return type are
// both derived from RouterMessageMap for the given message type, so passing
// the wrong shape - or expecting the wrong response - is a compile error.
export const sendMessage = <K extends RouterMessageType>(type: K, payload?: PayloadOf<K>): Promise<ResponseOf<K>> =>
  chrome.runtime.sendMessage({ source: "PRESENCES_POPUP", type, payload })
