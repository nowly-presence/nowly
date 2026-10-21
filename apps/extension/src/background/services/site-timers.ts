import type { TabPresenceEntry } from "@/background/services/background-context";
import type { PresencePayload } from "@/shared/types";

const SITE_TIMERS_SESSION_KEY = "siteTimers";
const SECOND_MS = 1000;

let pendingOperation = Promise.resolve();

const withSiteTimers = async <T>(operation: (timers: Record<string, number>) => Promise<T>): Promise<T> => {
  const previous = pendingOperation;
  let release = () => {};
  pendingOperation = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;

  try {
    const stored = await chrome.storage.session.get(SITE_TIMERS_SESSION_KEY);

    const value: unknown = stored[SITE_TIMERS_SESSION_KEY];
    const timers =
      value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] > 0)
          )
        : {};
    return await operation(timers);
  } finally {
    release();
  }
};

const sameContent = (left: PresencePayload, right: PresencePayload): boolean => {
  const leftUrl = left.buttons?.[0]?.url;
  const rightUrl = right.buttons?.[0]?.url;

  if (leftUrl || rightUrl) return leftUrl === rightUrl;

  return left.name === right.name && left.details === right.details && left.state === right.state;
};

export const isMediaPlayback = (entry: TabPresenceEntry, previous?: TabPresenceEntry): boolean =>
  entry.presence.endTime !== undefined ||
  entry.presence.smallImage === "play" ||
  entry.presence.smallImage === "pause" ||
  (previous?.mediaPlayback === true && previous.slug === entry.slug && sameContent(previous.presence, entry.presence));

export const applySiteTimer = async (entry: TabPresenceEntry, enabled: boolean): Promise<PresencePayload> => {
  if (!enabled || entry.mediaPlayback || isMediaPlayback(entry)) return entry.presence;

  return withSiteTimers(async (timers) => {
    const now = Math.floor(Date.now() / SECOND_MS);
    let startTime = timers[entry.slug];

    if (typeof startTime !== "number" || startTime > now) {
      const supplied = entry.presence.startTime;
      startTime = supplied && Number.isFinite(supplied) && supplied > 0 && supplied <= now ? supplied : now;
      await chrome.storage.session.set({
        [SITE_TIMERS_SESSION_KEY]: {
          ...timers,
          [entry.slug]: startTime
        }
      });
    }

    return { ...entry.presence, startTime };
  });
};

export const clearSiteTimers = (): Promise<void> =>
  withSiteTimers(async () => {
    await chrome.storage.session.set({
      [SITE_TIMERS_SESSION_KEY]: {}
    });
  });