import { IS_CANARY } from "@/shared/brand";
import { USER_SCRIPT_MESSAGE_SOURCE, WEB_BASE_URL } from "@/shared/constants";
import type { WebMessage } from "@/shared/types";
import { EXT_WEB_SOURCE, isWebBridgeRequest, WEB_BRIDGE_DETECTED, WEB_BRIDGE_PING, WEB_BRIDGE_REQUESTS } from "@nowly/shared/web-bridge-protocol";
import { toRouterMessageType } from "@/shared/web-bridge-routing";
import { startWebSeason } from "@/content/web-season";
import { registerCreatorBridge } from "@/content/creator-picker";
import { ACCOUNT_ORIGIN_MESSAGE_TYPES, isAllowedAccountOrigin } from "@/shared/web-origin";

const DEVICE_KEY = "deviceId";
const DEVICE_TOKEN_KEY = "deviceToken";
let MARKETPLACE_ORIGIN = new URL(WEB_BASE_URL).origin;

const isAllowedWebOrigin = (origin: string): boolean => {
  if (IS_CANARY) {
    return origin === MARKETPLACE_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin);
  }

  return origin === MARKETPLACE_ORIGIN;
};

const sendRuntimeMessage = async <T = unknown>(message: Record<string, unknown>): Promise<T | null> => {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return null;
  }
};

const getDeviceId = async (): Promise<string> => {
  const result = await chrome.storage.local.get(DEVICE_KEY);

  if (result[DEVICE_KEY]) return result[DEVICE_KEY] as string;

  const id = crypto.randomUUID();
  await chrome.storage.local.set({ [DEVICE_KEY]: id });
  return id;
};

const broadcastDetected = (): void => {
  let count = 0;
  const interval = window.setInterval(() => {
    window.postMessage(
      {
        source: EXT_WEB_SOURCE,
        type: WEB_BRIDGE_DETECTED
      },
      window.location.origin
    );
    count += 1;
    if (count >= 10) window.clearInterval(interval);
  }, 300);
};

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (event.source !== window || event.origin !== window.location.origin || !(isAllowedWebOrigin(event.origin) || isAllowedAccountOrigin(event.origin))) return;

  if (event.data?.source === EXT_WEB_SOURCE && event.data.type === WEB_BRIDGE_PING) {
    window.postMessage(
      {
        source: EXT_WEB_SOURCE,
        type: WEB_BRIDGE_DETECTED
      },
      window.location.origin
    );
  }
});

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (event.source !== window || event.origin !== window.location.origin) return;

  const msg = event.data;

  if (msg?.source !== EXT_WEB_SOURCE || !isWebBridgeRequest(msg.type)) return;

  const type = msg.type;

  if (!(isAllowedWebOrigin(event.origin) || (isAllowedAccountOrigin(event.origin) && ACCOUNT_ORIGIN_MESSAGE_TYPES.includes(type)))) return;

  if (!msg.messageId) return;

  if (type === "GET_DEVICE_INFO") {
    Promise.all([
      getDeviceId(),
      chrome.storage.local.get(DEVICE_TOKEN_KEY)
    ]).then(([deviceId, tokenResult]) => {
      const deviceToken = (tokenResult[DEVICE_TOKEN_KEY] as string | undefined) ?? null;
      window.postMessage(
        {
          source: EXT_WEB_SOURCE,
          type: WEB_BRIDGE_REQUESTS.GET_DEVICE_INFO,
          payload: { deviceId, deviceToken },
          messageId: msg.messageId
        },
        window.location.origin
      );
    });
    return;
  }

  sendRuntimeMessage({
    source: "PRESENCES_CONTENT",
    type: toRouterMessageType(type),
    payload: msg.payload
  }).then((response) => {
    window.postMessage(
      {
        source: EXT_WEB_SOURCE,
        type: WEB_BRIDGE_REQUESTS[type],
        payload: response ?? {
          ok: false,
          error: "BACKGROUND_UNAVAILABLE"
        },
        messageId: msg.messageId
      },
      window.location.origin
    );
  });
});

window.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.source !== USER_SCRIPT_MESSAGE_SOURCE) return;

  void sendRuntimeMessage({
    source: USER_SCRIPT_MESSAGE_SOURCE,
    type: event.data.type,
    payload: event.data.payload
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "UPDATE_MARKETPLACE_ORIGIN" && typeof message.origin === "string") {
    MARKETPLACE_ORIGIN = message.origin;
  }

  if (message?.type === "PRESENCE_SETTINGS_UPDATED") {
    window.postMessage(
      {
        source: "NOWLY_HOST",
        type: "SETTINGS_UPDATED",
        slug: message.slug,
        settings: message.settings,
        strings: message.strings
      },
      "*"
    );
  }
});

broadcastDetected();
registerCreatorBridge();
startWebSeason({
  target: window,
  storage: {
    get: (keys) => chrome.storage.local.get(keys),
    onChanged: chrome.storage.onChanged
  },
  isAllowedOrigin: isAllowedWebOrigin
});