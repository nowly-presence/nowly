/** Browser/OS detection helpers for analytics and device-sync payloads. */

export const browserName = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "edge";
  if (ua.includes("OPR/")) return "opera";
  return "chromium";
};

export const osName = (): string => {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("win")) return "windows";
  if (platform.includes("mac")) return "macos";
  if (platform.includes("linux")) return "linux";
  return "unknown";
};
