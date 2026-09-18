export const EXT_WEB_SOURCE = "Nowly";

export type ExtensionRequestType =
  | "PING"
  | "GET_INSTALLED"
  | "GET_DIAGNOSTIC"
  | "INSTALL_PRESENCE"
  | "UPDATE_PRESENCE"
  | "UNINSTALL_PRESENCE"
  | "GET_DEVICE_INFO"
  | "GET_ANALYTICS_CONSENT"
  | "SET_ANALYTICS_CONSENT";

export type ExtensionDeviceInfo = {
  deviceId: string | null
  deviceToken: string | null
};

export type ExtensionDiagnostic = {
  extensionInstalled: boolean
  userScriptsActive: boolean
  hostDetected: boolean
  discordConnected: boolean
  presenceInstalled: boolean
  activityDetected: boolean
};

export type InstalledPresenceInfo = {
  version: string | null
};

type PendingRequest = {
  resolve: (payload: unknown) => void
  reject: (error: Error) => void
  type: string
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

const resultTypeFor = (type: ExtensionRequestType): string => {
  if (type === "GET_INSTALLED") return "INSTALLED_PRESENCES";
  if (type === "GET_DEVICE_INFO") return "DEVICE_INFO";
  return `${type}_RESULT`;
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
  const data = event.data;
  if (!data || typeof data !== "object") return;
  const message = data as { source?: unknown; type?: unknown; messageId?: unknown; payload?: unknown };
  if (message.source !== EXT_WEB_SOURCE || typeof message.type !== "string") return;

  if (message.type === "EXT_DETECTED") {
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

  window.postMessage({ source: EXT_WEB_SOURCE, type: "PING" }, "*");
  pingTimer = window.setInterval(() => {
    window.postMessage({ source: EXT_WEB_SOURCE, type: "PING" }, "*");
  }, 300);
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

export const requestExtension = async <T>(
  type: Exclude<ExtensionRequestType, "PING">,
  payload?: unknown,
  timeoutMs = type === "INSTALL_PRESENCE" || type === "UPDATE_PRESENCE" ? 45000 : 8000,
): Promise<T> => {
  ensureListener();
  startDetection();

  const messageId = nextMessageId();
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(messageId);
      reject(new Error("extension request timed out"));
    }, timeoutMs);

    pending.set(messageId, {
      type: resultTypeFor(type),
      resolve: (value) => {
        window.clearTimeout(timer);
        resolve(value as T);
      },
      reject: (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    });

    window.postMessage(
      { source: EXT_WEB_SOURCE, type, messageId, payload },
      "*",
    );
  });
};

export const parseInstalledMap = (
  payload: unknown,
): Record<string, InstalledPresenceInfo> => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  const row = payload as Record<string, unknown>;
  if (row.ok === false) return {};

  const installed: Record<string, InstalledPresenceInfo> = {};
  for (const [slug, value] of Object.entries(row)) {
    if (!value || typeof value !== "object") continue;
    const entry = value as { metadata?: { version?: unknown }; release?: { version?: unknown } };
    const releaseVersion = normalizePresenceVersion(entry.release?.version);
    const metadataVersion = normalizePresenceVersion(entry.metadata?.version);
    installed[slug] = { version: releaseVersion ?? metadataVersion };
  }
  return installed;
};

export const normalizePresenceVersion = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const version = value.trim().replace(/^v/i, "");
  return version.length > 0 ? version : null;
};

export const isDevPresenceVersion = (version: string | null): boolean =>
  Boolean(version && (version.startsWith("0.0.0-dev.") || /-dev\./.test(version)));
