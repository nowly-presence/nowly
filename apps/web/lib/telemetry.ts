"use client";

import type { EventInput } from "@nowly/telemetry";

type UmamiTracker = { track: (name: string, data?: Record<string, unknown>) => void };

const KEY = "nowly:product-consent:v1";

export const siteConsent = (): boolean | null => {
  try {
    localStorage.removeItem("nowly:analytics:v1:deviceId");
    const value = localStorage.getItem(KEY);
    return value === "yes" ? true : value === "no" ? false : null;
  } catch {
    return null;
  }
};

export const setSiteConsent = (granted: boolean): void => {
  try {
    localStorage.setItem(KEY, granted ? "yes" : "no");
  } catch {
    return;
  }

  window.dispatchEvent(new Event("nowly:product-consent"));
};

// Website events go straight to Umami from the browser (the script in app/layout.tsx handles pageviews).
// Extension events still go through the API relay because the extension has no page to track.
export const trackProduct = (input: EventInput): void => {
  if (process.env.NODE_ENV !== "production") return;

  const umami = (window as Window & { umami?: UmamiTracker }).umami;

  umami?.track(input.name, input.data as Record<string, unknown>);
};