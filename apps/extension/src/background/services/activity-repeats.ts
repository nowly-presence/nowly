import type { PresencePayload } from "@/shared/types";

const REFRESH_MS = 15_000;
const TIMESTAMP_TOLERANCE_SECONDS = 2;

export type SentActivity = {
  presence: PresencePayload;
  sentAt: number;
};

const sameTime = (a: number | undefined, b: number | undefined): boolean =>
  a === undefined || b === undefined ? a === b : Math.abs(a - b) <= TIMESTAMP_TOLERANCE_SECONDS;

const withoutTimes = (presence: PresencePayload): string =>
  JSON.stringify({
    ...presence,
    startTime: undefined,
    endTime: undefined
  });

export const isRepeatedActivity = (last: SentActivity | null, presence: PresencePayload, now: number): boolean =>
  last !== null &&
  now - last.sentAt < REFRESH_MS &&
  sameTime(last.presence.startTime, presence.startTime) &&
  sameTime(last.presence.endTime, presence.endTime) &&
  withoutTimes(last.presence) === withoutTimes(presence);