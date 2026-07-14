import { API_BASE_URL, EXT_WEB_SOURCE, SUPPORTER_STATUS_KEY, WEB_BASE_URL } from "@/shared/constants";
import type { WebMessage } from "@/shared/types";

const USER_SCRIPT_MESSAGE_SOURCE = "NOWLY_PRESENCE";
const IS_UNPACKED = !chrome.runtime.getManifest().update_url;
const DEVICE_KEY = "deviceId";
const DEVICE_TOKEN_KEY = "deviceToken";
let MARKETPLACE_ORIGIN = new URL(WEB_BASE_URL).origin;
const WEB_MESSAGE_TYPES = new Set([
  "INSTALL_PRESENCE",
  "UPDATE_PRESENCE",
  "UNINSTALL_PRESENCE",
  "GET_INSTALLED",
  "GET_DIAGNOSTIC",
  "GET_AD_STATUS",
  "GET_DEVICE_INFO",
  "REDEEM_SUPPORT_CODE",
]);

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

const getAdStatus = async (): Promise<Record<string, unknown>> => {
  const deviceId = await getDeviceId();
  const response = await fetch(`${API_BASE_URL}/ads/status?deviceId=${encodeURIComponent(deviceId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false, hasAds: true, adFree: false, deviceId };
  }

  const status = await response.json() as { hasAds?: unknown; adFree?: unknown };
  return {
    ok: true,
    hasAds: status.hasAds !== false,
    adFree: status.adFree === true,
    deviceId,
  };
};

const redeemSupportCode = async (code: string): Promise<Record<string, unknown>> => {
  const deviceId = await getDeviceId();
  const response = await fetch(`${API_BASE_URL}/support/redeem-device`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, deviceId }),
  });

  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  const result = {
    ok: response.ok && payload.ok !== false,
    deviceId,
    ...payload,
  };

  if (result.ok === true) {
    await chrome.storage.local.set({
      [SUPPORTER_STATUS_KEY]: {
        adFree: true,
        hasAds: false,
        deviceId,
        activatedAt: new Date().toISOString(),
        showThankYou: true,
      },
    });
    chrome.runtime.sendMessage({
      source: "PRESENCES_CONTENT",
      type: "SUPPORTER_STATUS_CHANGED",
      payload: { adFree: true, deviceId },
    }).catch(() => {});
  }

  return result;
};

const broadcastDetected = (): void => {
  let count = 0;
  const interval = window.setInterval(() => {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "EXT_DETECTED" }, "*");
    count += 1;
    if (count >= 10) window.clearInterval(interval);
  }, 300);
};

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (!IS_UNPACKED && event.origin !== MARKETPLACE_ORIGIN) return;

  if (event.data?.source === EXT_WEB_SOURCE && event.data.type === "PING") {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "EXT_DETECTED" }, "*");
  }
});

window.addEventListener("message", (event: MessageEvent<WebMessage>) => {
  if (!IS_UNPACKED && event.origin !== MARKETPLACE_ORIGIN) return;
  if (event.data?.source !== EXT_WEB_SOURCE || event.data.type === "PING") return;
  if (!WEB_MESSAGE_TYPES.has(event.data.type)) return;

  const msg = event.data;
  if (!msg.messageId) return;

  if (msg.type === "GET_AD_STATUS") {
    getAdStatus()
      .then((payload) => {
        window.postMessage(
          { source: EXT_WEB_SOURCE, type: "AD_STATUS", payload, messageId: msg.messageId },
          "*",
        );
      })
      .catch(() => {
        window.postMessage(
          { source: EXT_WEB_SOURCE, type: "AD_STATUS", payload: { ok: false, hasAds: true, adFree: false }, messageId: msg.messageId },
          "*",
        );
      });
    return;
  }

  if (msg.type === "GET_DEVICE_INFO") {
    Promise.all([getDeviceId(), chrome.storage.local.get(DEVICE_TOKEN_KEY)]).then(([deviceId, tokenResult]) => {
      const deviceToken = (tokenResult[DEVICE_TOKEN_KEY] as string | undefined) ?? null;
      window.postMessage(
        { source: EXT_WEB_SOURCE, type: "DEVICE_INFO", payload: { deviceId, deviceToken }, messageId: msg.messageId },
        "*",
      );
    });
    return;
  }

  if (msg.type === "REDEEM_SUPPORT_CODE") {
    const { code } = (msg.payload ?? {}) as { code?: string };
    if (!code) {
      window.postMessage(
        { source: EXT_WEB_SOURCE, type: "REDEEM_SUPPORT_CODE_RESULT", payload: { ok: false, error: "missing_code" }, messageId: msg.messageId },
        "*",
      );
      return;
    }

    redeemSupportCode(code)
      .then((payload) => {
        window.postMessage(
          { source: EXT_WEB_SOURCE, type: "REDEEM_SUPPORT_CODE_RESULT", payload, messageId: msg.messageId },
          "*",
        );
      })
      .catch(() => {
        window.postMessage(
          { source: EXT_WEB_SOURCE, type: "REDEEM_SUPPORT_CODE_RESULT", payload: { ok: false, error: "network_error" }, messageId: msg.messageId },
          "*",
        );
      });
    return;
  }

  sendRuntimeMessage({
      source: "PRESENCES_CONTENT",
      type: msg.type,
      payload: msg.payload,
    })
    .then((response) => {
      window.postMessage(
        {
          source: EXT_WEB_SOURCE,
          type: msg.type === "GET_INSTALLED" ? "INSTALLED_PRESENCES" : `${msg.type}_RESULT`,
          payload: response ?? { ok: false, error: "background unavailable" },
          messageId: msg.messageId,
        },
        "*",
      );
    });
});

window.addEventListener("message", (event: MessageEvent) => {
  if (event.data?.source !== USER_SCRIPT_MESSAGE_SOURCE) return;

  void sendRuntimeMessage({
    source: USER_SCRIPT_MESSAGE_SOURCE,
    type: event.data.type,
    payload: event.data.payload,
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "UPDATE_MARKETPLACE_ORIGIN" && typeof message.origin === "string") {
    MARKETPLACE_ORIGIN = message.origin;
  }

  if (message?.type === "PRESENCE_SETTINGS_UPDATED") {
    window.postMessage({
      source: "NOWLY_HOST",
      type: "SETTINGS_UPDATED",
      slug: message.slug,
      settings: message.settings,
      strings: message.strings,
    }, "*");
  }
});

broadcastDetected();
