import type { ExtensionMessageType } from "@/shared/types";

export type NativeStatus = {
  connected: boolean;
  status: string;
  version?: string;
  discordConnected?: boolean;
};

export const sendMessage = <T,>(type: ExtensionMessageType, payload?: unknown): Promise<T> =>
  chrome.runtime.sendMessage({ source: "PRESENCES_POPUP", type, payload });
