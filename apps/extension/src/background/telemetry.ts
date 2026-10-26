import { sendEvent, retentionPlan, localStateSchema, type EventInput } from "@nowly/telemetry";
import { getEffectiveApiUrl } from "@/background/services/api-state";
import { getAnalyticsConsent } from "@/background/storage/device.store";
import { IS_CANARY } from "@/shared/brand";

const KEY = "productTelemetryV1";
let pending: Promise<unknown> = Promise.resolve();

const serialized = <T>(task: () => Promise<T>): Promise<T> => {
  const next = pending.then(task, task);
  pending = next.catch(() => {});
  return next;
};

export const clearProductTelemetry = (): Promise<void> => serialized(() => chrome.storage.local.remove(KEY));

export const trackProduct = (
  input: EventInput,
  dedup?: {
    daily?: string;
    once?: string;
  }
): Promise<void> =>
  serialized(async () => {
    if (IS_CANARY || !(await getAnalyticsConsent())) return;

    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const result = await chrome.storage.local.get(KEY);

    let state = localStateSchema.safeParse(result[KEY]).data;

    if (!state) {
      const ok = await sendEvent(
        getEffectiveApiUrl(),
        {
          name: "extension_first_seen",
          source: "extension",
          data: { cohort_day: day }
        },
        getAnalyticsConsent
      );

      if (!ok || !(await getAnalyticsConsent())) return;

      state = {
        startedAt: now,
        returned: [],
        daily: {},
        once: []
      };
      await chrome.storage.local.set({ [KEY]: state });
    }

    const alreadyDaily = Boolean(dedup?.daily && state.daily[dedup.daily] === day);

    if (dedup?.once && state.once.includes(dedup.once)) return;

    const ok = alreadyDaily || (await sendEvent(getEffectiveApiUrl(), input, getAnalyticsConsent));

    if (!ok || !(await getAnalyticsConsent())) return;

    if (dedup?.daily) state.daily[dedup.daily] = day;
    if (dedup?.once) state.once.push(dedup.once);

    if (input.name === "extension_active" || input.name === "presence_used") {
      const retention = retentionPlan(state, now);
      if (
        retention &&
        (await sendEvent(
          getEffectiveApiUrl(),
          {
            name: "retention_return",
            source: "extension",
            data: retention
          },
          getAnalyticsConsent
        ))
      ) state.returned.push(retention.day);
    }

    if (await getAnalyticsConsent()) await chrome.storage.local.set({ [KEY]: state });
  });