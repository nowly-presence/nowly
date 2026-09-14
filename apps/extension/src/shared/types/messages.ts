export type WebMessageType =
  | "INSTALL_PRESENCE"
  | "UPDATE_PRESENCE"
  | "UNINSTALL_PRESENCE"
  | "GET_INSTALLED"
  | "GET_DIAGNOSTIC"
  | "GET_AD_STATUS"
  | "GET_DEVICE_INFO"
  | "REDEEM_SUPPORT_CODE";

export type ExtensionMessageType =
  | "GET_PRESENCES"
  | "GET_INSTALLED"
  | "GET_DIAGNOSTIC"
  | "GET_NATIVE_STATUS"
  | "GET_USER_SCRIPTS_STATUS"
  | "CONNECT_NATIVE"
  | "RESTART_NATIVE"
  | "GET_CURRENT_ACTIVITY"
  | "GET_DEBUG"
  | "TOGGLE_PRESENCE"
  | "UNINSTALL_PRESENCE"
  | "ACTIVITY_UPDATE"
  | "CLEAR_ACTIVITY"
  | "INSTALL_PRESENCE"
  | "INSTALL_PRESENCE_FROM_API"
  | "FETCH_PRESENCE_CATALOG"
  | "UPDATE_PRESENCE"
  | "DEBUG"
  | "CHECK_UPDATES"
  | "GET_SETTINGS"
  | "SET_SETTINGS"
  | "GET_SUPPORTER_STATUS"
  | "DISMISS_SUPPORTER_THANK_YOU"
  | "RESET_ONBOARDING_FOR_DEV"
  | "GET_PRESENCE_SETTINGS"
  | "SET_PRESENCE_SETTINGS"
  | "SNOOZE_PRESENCE"
  | "CLEAR_SNOOZE"
  | "SET_PRESENCE_SCHEDULE"
  | "GET_ANALYTICS_LOGS"
  | "CLEAR_ANALYTICS_LOGS";

export type UserScriptsStatus = {
  enabled: boolean;
  reason?: string;
  // Chrome requires an explicit user toggle in the extension details UI.
  // This is surfaced so onboarding can explain what to do.
  requiresUserToggle?: boolean;
};

export type WebMessage = {
  source: typeof import("@/shared/constants").EXT_WEB_SOURCE;
  type: WebMessageType | "PING";
  payload?: unknown;
  messageId?: string;
};

export type ExtensionMessage = {
  source: "PRESENCES_POPUP" | "PRESENCES_CONTENT";
  type: ExtensionMessageType;
  payload?: unknown;
};
