import type { PresencePayload } from "@/shared/types";

export type TabPresenceEntry = {
  slug: string;
  presence: PresencePayload;
  updatedAt: number;
  mediaPlayback?: boolean;
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