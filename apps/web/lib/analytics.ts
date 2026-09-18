"use client";

import {
  alwaysGrantedConsent,
  createAnalyticsClient,
  createBrowserIdentity,
  createHttpTransport,
  type TrackInput,
} from "@nowly/analytics";
import { presenceApiBaseUrl } from "@/lib/presence-api";

const client = createAnalyticsClient({
  transport: createHttpTransport(presenceApiBaseUrl()),
  consent: alwaysGrantedConsent,
  identity: createBrowserIdentity(),
  flushAt: 1,
});

export const trackPublicAnalytics = (key: string, input: TrackInput = {}): void => {
  void client.track(key, input).catch(() => {
    // Best-effort ingest.
  });
};
