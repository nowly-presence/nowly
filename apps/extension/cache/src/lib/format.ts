import type { CurrentActivity } from "@/shared/types";

export const formatRelativeTime = (timestamp?: number): string | null => {
  if (!timestamp) return null;

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 5) return "now";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  return `${Math.floor(minutes / 60)}h ago`;
};

export const getActivityTitle = (activity: CurrentActivity | null, fallback: string): string =>
  activity?.presence.details ?? fallback;

export const getActivitySubtitle = (activity: CurrentActivity | null, fallback: string): string =>
  activity?.presence.state ?? activity?.presence.name ?? fallback;
