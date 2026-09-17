import { alwaysGrantedConsent, createAnalyticsClient, type TrackInput } from "@nowly/analytics";
import { getActiveDeviceId } from "@/background/services/device-sync";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { browserName, osName } from "@/background/services/device-info";

const client = createAnalyticsClient({
  transport: {
    async send(events) {
      const response = await fetch(`${getEffectiveApiUrl()}/insights/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      if (!response.ok) {
        throw new Error(`analytics transport failed: ${response.status}`);
      }
    },
  },
  consent: alwaysGrantedConsent,
  identity: {
    getDeviceId: () => getActiveDeviceId(),
  },
  flushAt: 1,
});

export const analyticsContext = (): Record<string, string> => ({
  extensionVersion: chrome.runtime.getManifest().version,
  browser: browserName(),
  os: osName(),
});

export const trackAnalytics = (key: string, input: TrackInput = {}): void => {
  void client.track(key, {
    ...input,
    payload: {
      ...analyticsContext(),
      ...input.payload,
    },
  }).catch(() => {
    // Best-effort ingest.
  });
};
