"use client";

import type { EventInput } from "@nowly/telemetry";

type UmamiTracker = { track: (name: string, data?: Record<string, unknown>) => void };

// Website events go straight to Umami from the browser (the script in app/layout.tsx handles pageviews).
// Extension events still go through the API relay because the extension has no page to track.
export const trackProduct = (input: EventInput): void => {
  if (process.env.NODE_ENV !== "production") return;

  const umami = (window as Window & { umami?: UmamiTracker }).umami;

  umami?.track(input.name, input.data as Record<string, unknown>);
};