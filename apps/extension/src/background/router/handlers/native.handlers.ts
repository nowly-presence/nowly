import type { Handler } from "@/background/router/router";
import type { UserScriptsStatus } from "@/shared/types";

export const unpackedUserScriptsStatus = (): UserScriptsStatus => {
  const available = "userScripts" in chrome && Boolean(chrome.userScripts);
  return {
    enabled: available,
    requiresUserToggle: true,
    reason: available ? undefined : "chrome.userScripts unavailable. Enable Developer Mode / Allow User Scripts for this extension."
  };
};

export const handleGetUserScriptsStatus: Handler<"GET_USER_SCRIPTS_STATUS"> = async () => {
  if (import.meta.env.BROWSER !== "firefox") return unpackedUserScriptsStatus();

  const granted = await chrome.permissions.contains({
    permissions: ["userScripts"]
  });
  return {
    enabled: granted,
    requiresUserToggle: !granted,
    reason: granted ? undefined : "userScripts permission not granted"
  };
};