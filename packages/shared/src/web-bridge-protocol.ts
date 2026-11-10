export const EXT_WEB_SOURCE = "Nowly";
export const WEB_BRIDGE_PING = "PING";
export const WEB_BRIDGE_DETECTED = "EXT_DETECTED";
export const SEASON_REQUEST = "GET_SEASON";
export const SEASON_MESSAGE = "SEASON";

export const WEB_BRIDGE_REQUESTS = {
  GET_INSTALLED: "INSTALLED_PRESENCES",
  GET_DIAGNOSTIC: "GET_DIAGNOSTIC_RESULT",
  INSTALL_PRESENCE: "INSTALL_PRESENCE_RESULT",
  UPDATE_PRESENCE: "UPDATE_PRESENCE_RESULT",
  UNINSTALL_PRESENCE: "UNINSTALL_PRESENCE_RESULT",
  GET_DEVICE_INFO: "DEVICE_INFO",
  GET_ANALYTICS_CONSENT: "GET_ANALYTICS_CONSENT_RESULT",
  SET_ANALYTICS_CONSENT: "SET_ANALYTICS_CONSENT_RESULT",
  NOWLY_SESSION: "NOWLY_SESSION_RESULT",
  GET_ACTIVITY_PUBLICATION_STATUS: "GET_ACTIVITY_PUBLICATION_STATUS_RESULT",
  APPLY_ACTIVITY_PUBLICATION: "APPLY_ACTIVITY_PUBLICATION_RESULT",
  REPORT_CREATE: "REPORT_CREATE_RESULT",
  REPORT_IDENTITY: "REPORT_IDENTITY_RESULT"
} as const;

export type WebBridgeRequest = keyof typeof WEB_BRIDGE_REQUESTS;

export const isWebBridgeRequest = (value: unknown): value is WebBridgeRequest => typeof value === "string" && Object.hasOwn(WEB_BRIDGE_REQUESTS, value);

export type ExtensionDeviceInfo = {
  deviceId: string | null;
  deviceToken: string | null;
};

export type ExtensionReportResult = {
  ok: boolean;
  error?: string;
};

export type ExtensionDiagnostic = {
  extensionInstalled: boolean;
  userScriptsActive: boolean;
  hostDetected: boolean;
  discordConnected: boolean;
  presenceInstalled: boolean;
  activityDetected: boolean;
};