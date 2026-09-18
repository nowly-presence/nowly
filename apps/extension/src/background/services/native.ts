import { NATIVE_HOST } from "@/shared/constants";
import type { NativeMessage, NativeResponse, PresenceData, PresencePayload } from "@/shared/types";
import { trackAnalytics } from "@/background/analytics-client";
import { setNativeProfile, setNativeSeenConnectedOnce } from "@/background/services/storage";

let nativePort: chrome.runtime.Port | null = null;
let connected = false;
let status = "not connected";
let connecting = false;
let discordConnected = false;
let version: string | undefined;
let lastAutoConnectAttemptAt = 0;
const AUTO_CONNECT_RETRY_MS = 5000;
const responseListeners = new Set<(message: NativeResponse) => void>();

export const mapPresenceData = (data: PresenceData): PresencePayload => ({
  name: data.name,
  details: data.details,
  state: data.state,
  startTime: data.startTimestamp,
  endTime: data.endTimestamp,
  largeImage: data.largeImageKey,
  largeText: data.largeImageText,
  smallImage: data.smallImageKey,
  smallText: data.smallImageText,
  type: data.type,
  buttons: data.buttons?.slice(0, 2),
});

export const getNativeStatus = () => ({ connected, status, discordConnected, version });

export const onNativeResponse = (listener: (message: NativeResponse) => void): (() => void) => {
  responseListeners.add(listener);
  return () => responseListeners.delete(listener);
};

export const refreshNativeStatus = (): { connected: boolean; status: string; discordConnected: boolean; version?: string } => {
  if (nativePort) {
    postNative({ type: "PING" });
  } else if (!connecting && Date.now() - lastAutoConnectAttemptAt >= AUTO_CONNECT_RETRY_MS) {
    lastAutoConnectAttemptAt = Date.now();
    connectNative({ silent: true });
  }
  return getNativeStatus();
};

export const reconnectNative = (): { connected: boolean; status: string; discordConnected: boolean; version?: string } => {
  if (nativePort && (connected || connecting)) {
    postNative({ type: "PING" });
    return getNativeStatus();
  }

  if (nativePort) {
    try {
      nativePort.disconnect();
    } catch {
      // Ignore stale ports.
    }
  }

  nativePort = null;
  connected = false;
  discordConnected = false;
  version = undefined;
  status = "connecting";
  trackAnalytics("native_reconnect", { source: "extension_settings" });
  connectNative();
  return getNativeStatus();
};

export const restartNative = (): { connected: boolean; status: string; discordConnected: boolean; version?: string } => {
  if (nativePort) {
    try {
      nativePort.disconnect();
    } catch {
      // Ignore stale ports.
    }
  }

  nativePort = null;
  connected = false;
  discordConnected = false;
  version = undefined;
  status = "connecting";
  trackAnalytics("native_reconnect", { source: "extension_settings" });
  connectNative();
  return getNativeStatus();
};

export const connectNative = (options: { silent?: boolean } = {}): void => {
  if (nativePort) return;
  if (connecting) return;

  try {
    connecting = true;
    nativePort = chrome.runtime.connectNative(NATIVE_HOST);
    if (!options.silent) {
      status = "connecting";
    }
  } catch (error) {
    nativePort = null;
    connecting = false;
    connected = false;
    status = error instanceof Error ? error.message : "Nowly Host unavailable";
    return;
  }

  nativePort.onMessage.addListener((message: NativeResponse) => {
    for (const listener of responseListeners) listener(message);

    if (message.type === "CONNECTED") {
      connecting = false;
      connected = true;
      status = "connected";
      version = message.version ?? version;
    }

    if (message.type === "PONG") {
      connecting = false;
      connected = message.connected;
      status = message.status;
      version = message.version ?? version;

      discordConnected = Boolean(message.discordConnected);
      if (discordConnected) {
        void setNativeSeenConnectedOnce(true);
      }
      if (message.profile) {
        void setNativeProfile(message.profile);
      }
    }

    if (message.type === "ERROR") {
      connecting = false;
      status = message.error;
    }
  });

  nativePort.onDisconnect.addListener(() => {
    const wasConnected = connected;
    connecting = false;
    connected = false;
    discordConnected = false;
    version = undefined;
    status = chrome.runtime.lastError?.message ?? "native disconnected";
    nativePort = null;
    if (wasConnected) trackAnalytics("native_disconnected", { payload: { reason: status } });
  });

  postNative({ type: "PING" });
};

export const postNative = (message: NativeMessage): boolean => {
  connectNative();
  if (!nativePort) return false;

  try {
    nativePort.postMessage(message);
    return true;
  } catch (error) {
    connecting = false;
    connected = false;
    status = error instanceof Error ? error.message : "native post failed";
    nativePort = null;
    return false;
  }
};