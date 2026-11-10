import { EXT_WEB_SOURCE, WEB_BRIDGE_DETECTED, WEB_BRIDGE_PING, WEB_BRIDGE_REQUESTS, type WebBridgeRequest } from "./web-bridge-protocol";

type PendingRequest = {
  resolve: (payload: unknown) => void;
  type: string;
};

type DetectedListener = (detected: boolean) => void;

let messageSeq = 0;
let pingTimer: number | null = null;
let pingTimeout: number | null = null;
let listening = false;
let detected: boolean | null = null;
const detectedListeners = new Set<DetectedListener>();
const pending = new Map<string, PendingRequest>();

const nextMessageId = (): string => {
  messageSeq += 1;
  return `nowly-web-${messageSeq}-${Date.now()}`;
};

const notifyDetected = (value: boolean): void => {
  if (detected === value) return;

  detected = value;
  detectedListeners.forEach((listener) => listener(value));
};

const stopPing = (): void => {
  if (pingTimer !== null) {
    window.clearInterval(pingTimer);
    pingTimer = null;
  }

  if (pingTimeout !== null) {
    window.clearTimeout(pingTimeout);
    pingTimeout = null;
  }
};

const onWindowMessage = (event: MessageEvent): void => {
  if (event.source !== window || event.origin !== window.location.origin) return;

  const data = event.data;

  if (!data || typeof data !== "object") return;

  const message = data as {
    source?: unknown;
    type?: unknown;
    messageId?: unknown;
    payload?: unknown;
  };

  if (message.source !== EXT_WEB_SOURCE || typeof message.type !== "string") return;

  if (message.type === WEB_BRIDGE_DETECTED) {
    stopPing();
    notifyDetected(true);
    return;
  }

  if (typeof message.messageId !== "string") return;

  const request = pending.get(message.messageId);

  if (!request) return;
  if (message.type !== request.type) return;

  pending.delete(message.messageId);
  request.resolve(message.payload);
};

const ensureListener = (): void => {
  if (listening || typeof window === "undefined") return;

  listening = true;
  window.addEventListener("message", onWindowMessage);
};

const startDetection = (): void => {
  ensureListener();

  if (detected !== null || pingTimer !== null) return;

  const ping = () => {
    window.postMessage(
      {
        source: EXT_WEB_SOURCE,
        type: WEB_BRIDGE_PING
      },
      window.location.origin
    );
  };
  ping();
  pingTimer = window.setInterval(ping, 300);
  pingTimeout = window.setTimeout(() => {
    stopPing();
    if (detected === null) notifyDetected(false);
  }, 4000);
};

export const getExtensionDetected = (): boolean | null => detected;

export const subscribeExtensionDetected = (listener: DetectedListener): (() => void) => {
  detectedListeners.add(listener);
  startDetection();
  if (detected !== null) listener(detected);
  return () => {
    detectedListeners.delete(listener);
  };
};

const requestTimeouts: Partial<Record<WebBridgeRequest, number>> = {
  INSTALL_PRESENCE: 45_000,
  UPDATE_PRESENCE: 45_000,
  NOWLY_SESSION: 15_000
};

export class ExtensionRequestTimeoutError extends Error {
  constructor() {
    super("extension request timed out");
    this.name = "ExtensionRequestTimeoutError";
  }
}

export const requestExtension = async <T>(type: WebBridgeRequest, payload?: unknown, timeoutMs = requestTimeouts[type] ?? 8_000): Promise<T> => {
  startDetection();

  const messageId = nextMessageId();
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(messageId);
      reject(new ExtensionRequestTimeoutError());
    }, timeoutMs);

    pending.set(messageId, {
      type: WEB_BRIDGE_REQUESTS[type],
      resolve: (value) => {
        window.clearTimeout(timer);
        resolve(value as T);
      }
    });

    window.postMessage(
      {
        source: EXT_WEB_SOURCE,
        type,
        messageId,
        payload
      },
      window.location.origin
    );
  });
};