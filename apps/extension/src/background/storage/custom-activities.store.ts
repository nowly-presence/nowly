import { STORAGE_KEYS } from "@/background/storage/keys";
import {
  buildCustomPresence,
  customActivitySlug,
} from "@/shared/custom-activity";
import type {
  CustomActivitiesState,
  CustomActivity,
  PresencePayload,
  StoredCustomImage,
} from "@/shared/types";

const EMPTY_STATE: CustomActivitiesState = {
  items: [],
  activeId: null,
  activatedAt: null,
};

const isState = (value: unknown): value is CustomActivitiesState =>
  Boolean(value) &&
  typeof value === "object" &&
  Array.isArray((value as CustomActivitiesState).items);

export const getCustomActivities = async (): Promise<CustomActivitiesState> => {
  const result = await chrome.storage.local.get(STORAGE_KEYS.customActivities);
  const value = result[STORAGE_KEYS.customActivities];
  return isState(value) ? value : EMPTY_STATE;
};

export const setCustomActivities = (
  state: CustomActivitiesState,
): Promise<void> =>
  chrome.storage.local.set({ [STORAGE_KEYS.customActivities]: state });

export const updateCustomActivities = async (
  update: (state: CustomActivitiesState) => CustomActivitiesState,
): Promise<CustomActivitiesState> => {
  const next = update(await getCustomActivities());
  await setCustomActivities(next);
  return next;
};

export const getActiveCustomActivity = async (): Promise<{
  activity: CustomActivity;
  activatedAt: number;
} | null> => {
  const state = await getCustomActivities();
  const activity = state.items.find((item) => item.id === state.activeId);
  return activity
    ? { activity, activatedAt: state.activatedAt ?? Date.now() }
    : null;
};

export const getActiveCustomPresence = async (): Promise<{
  slug: string;
  presence: PresencePayload;
} | null> => {
  const active = await getActiveCustomActivity();
  return active
    ? {
        slug: customActivitySlug(active.activity.id),
        presence: buildCustomPresence(active.activity, active.activatedAt),
      }
    : null;
};

export const getCustomImages = async (): Promise<
  Record<string, StoredCustomImage>
> => {
  const result = await chrome.storage.local.get(
    STORAGE_KEYS.customActivityImages,
  );
  const value = result[STORAGE_KEYS.customActivityImages];
  return value && typeof value === "object"
    ? (value as Record<string, StoredCustomImage>)
    : {};
};

export const setCustomImages = (
  images: Record<string, StoredCustomImage>,
): Promise<void> =>
  chrome.storage.local.set({ [STORAGE_KEYS.customActivityImages]: images });