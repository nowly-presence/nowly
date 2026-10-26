import type { PayloadOf, ResponseOf, RouterMessageType } from "@/background/router/contracts";

export const sendMessage = <K extends RouterMessageType>(type: K, payload?: PayloadOf<K>): Promise<ResponseOf<K>> =>
  chrome.runtime.sendMessage({
    source: "PRESENCES_POPUP",
    type,
    payload
  });