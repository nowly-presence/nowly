import { createAnalyticsClient, type ConsentState, type TrackInput } from "@nowly/analytics";
import { getActiveDeviceId } from "@/background/services/device-sync";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getAnalyticsConsent } from "@/background/services/storage";

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
  // Opt-in: nothing is sent until the user explicitly grants consent in settings.
  consent: {
    get: async (): Promise<ConsentState> => (await getAnalyticsConsent()) ? "granted" : "denied",
  },
  identity: {
    getDeviceId: () => getActiveDeviceId(),
  },
  flushAt: 1,
});

export const trackAnalytics = (key: string, input: TrackInput = {}): void => {
  void client.track(key, input).catch(() => {
    // Best-effort ingest.
  });
};
