import { getCustomActivities } from "@/background/storage/custom-activities.store";
import { buildCustomPresence, customActivitySlug } from "@/shared/custom-activity";
import { CUSTOM_ACTIVITY_DETECTION_DISMISSED_KEY, CUSTOM_ACTIVITY_DETECTION_KEY, detectionHost, matchesDetectionUrl } from "@/shared/custom-activity-detection";
import type { CustomActivity, CustomActivityDetection, PresencePayload } from "@/shared/types";

export type EffectiveCustomActivity = {
  activity: CustomActivity;
  activatedAt: number;
  detected: boolean;
  host: string | null;
};

export type EffectiveCustomPresence = {
  slug: string;
  presence: PresencePayload;
  host: string | null;
};

type DetectionDismissal = {
  activityId: string;
  tabId: number;
};

const isDetection = (value: unknown): value is CustomActivityDetection => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CustomActivityDetection>;
  return typeof candidate.activityId === "string" && typeof candidate.host === "string" && typeof candidate.tabId === "number" && typeof candidate.activatedAt === "number";
};

const isDismissal = (value: unknown): value is DetectionDismissal => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<DetectionDismissal>;
  return typeof candidate.activityId === "string" && typeof candidate.tabId === "number";
};

const sameDetection = (first: CustomActivityDetection | null, second: CustomActivityDetection | null): boolean =>
  first?.activityId === second?.activityId && first?.tabId === second?.tabId && first?.host === second?.host;

const writeDetection = (detection: CustomActivityDetection | null): Promise<void> =>
  chrome.storage.session.set({ [CUSTOM_ACTIVITY_DETECTION_KEY]: detection });

const readDismissal = async (): Promise<DetectionDismissal | null> => {
  const result = await chrome.storage.session.get(CUSTOM_ACTIVITY_DETECTION_DISMISSED_KEY);
  const value = result[CUSTOM_ACTIVITY_DETECTION_DISMISSED_KEY];
  return isDismissal(value) ? value : null;
};

const writeDismissal = (dismissal: DetectionDismissal | null): Promise<void> =>
  chrome.storage.session.set({ [CUSTOM_ACTIVITY_DETECTION_DISMISSED_KEY]: dismissal });

const focusedTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  if (tab) return tab;

  const [fallback] = await chrome.tabs.query({ active: true });
  return fallback;
};

export const readCustomActivityDetection = async (): Promise<CustomActivityDetection | null> => {
  const result = await chrome.storage.session.get(CUSTOM_ACTIVITY_DETECTION_KEY);
  const value = result[CUSTOM_ACTIVITY_DETECTION_KEY];
  return isDetection(value) ? value : null;
};

export const resolveCustomActivityDetection = async (): Promise<CustomActivityDetection | null> => {
  const state = await getCustomActivities();
  const previous = await readCustomActivityDetection();

  if (state.items.some((item) => item.id === state.activeId)) {
    if (previous) await writeDetection(null);
    return null;
  }

  const tab = await focusedTab();

  if (!tab || !tab.url) return previous;

  const matching = state.items
    .filter((item) => item.detectionUrl.trim() && matchesDetectionUrl(item.detectionUrl, tab.url))
    .sort((first, second) => second.updatedAt - first.updatedAt)[0];

  if (!matching) {
    if (previous) await writeDetection(null);
    return null;
  }

  const dismissal = await readDismissal();

  if (dismissal && dismissal.activityId === matching.id && dismissal.tabId === tab.id) {
    if (previous) await writeDetection(null);
    return null;
  }

  if (dismissal) await writeDismissal(null);

  const host = detectionHost(matching.detectionUrl);
  const next: CustomActivityDetection = {
    activityId: matching.id,
    host,
    tabId: tab.id ?? -1,
    activatedAt: previous && previous.activityId === matching.id && previous.tabId === tab.id ? previous.activatedAt : Date.now()
  };

  if (!sameDetection(previous, next)) await writeDetection(next);

  return next;
};

export const refreshCustomActivityDetection = async (): Promise<boolean> => {
  const previous = await readCustomActivityDetection();
  const next = await resolveCustomActivityDetection();
  return !sameDetection(previous, next);
};

export const dismissCustomActivityDetection = async (activityId: string | null): Promise<void> => {
  const detection = await readCustomActivityDetection();

  if (detection && (activityId === null || detection.activityId === activityId)) {
    await writeDismissal({
      activityId: detection.activityId,
      tabId: detection.tabId
    });
  }

  await writeDetection(null);
};

export const getEffectiveCustomActivity = async (): Promise<EffectiveCustomActivity | null> => {
  const state = await getCustomActivities();
  const manual = state.items.find((item) => item.id === state.activeId);

  if (manual) {
    return {
      activity: manual,
      activatedAt: state.activatedAt ?? Date.now(),
      detected: false,
      host: null
    };
  }

  const detection = await resolveCustomActivityDetection();

  if (!detection) return null;

  const activity = state.items.find((item) => item.id === detection.activityId);

  if (!activity) return null;

  return {
    activity,
    activatedAt: detection.activatedAt,
    detected: true,
    host: detection.host
  };
};

export const getEffectiveCustomPresence = async (): Promise<EffectiveCustomPresence | null> => {
  const active = await getEffectiveCustomActivity();

  if (!active) return null;

  return {
    slug: customActivitySlug(active.activity.id),
    presence: buildCustomPresence(active.activity, active.activatedAt),
    host: active.host
  };
};
