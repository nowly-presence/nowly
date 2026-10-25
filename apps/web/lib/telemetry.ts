"use client";

import { sendEvent, type EventInput } from "@nowly/telemetry";
import { presenceApiBaseUrl } from "@/lib/presence-api-client";

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

export const trackProduct = (input: EventInput): void => {
  if (process.env.NODE_ENV !== "production") return;

  void sendEvent(presenceApiBaseUrl(), input, () => siteConsent() === true);
};