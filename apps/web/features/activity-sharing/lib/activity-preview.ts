import type { PortableActivity } from "@nowly/shared";

const MINUTE_SECONDS = 60;
const HOUR_SECONDS = 3600;

export const previewClock = (totalSeconds: number): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / HOUR_SECONDS);
  const minutes = Math.floor((seconds % HOUR_SECONDS) / MINUTE_SECONDS);
  const pad = (value: number) => String(value).padStart(2, "0");
  const clock = `${minutes}:${pad(seconds % MINUTE_SECONDS)}`;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds % MINUTE_SECONDS)}` : clock;
};

export const previewImage = (image: PortableActivity["largeImage"]): string | null => {
  if (image.kind === "embedded") return image.dataUrl;
  if (image.kind === "url") return image.url;
  if (image.kind === "icon") return `/api/activity-icon/${image.icon}/${image.color.slice(1).toLowerCase()}.png?v=1`;

  return null;
};

export const previewLines = (activity: PortableActivity): string[] => {
  if (activity.type === 0) return [activity.name, activity.details, activity.state].filter(Boolean);
  if (activity.details || activity.state) return [activity.details, activity.state].filter(Boolean);

  return [activity.name];
};

export const previewHeader = (activity: PortableActivity) => {
  if (activity.type === 0) return "playing";

  const hasContent = Boolean(activity.details || activity.state);

  if (activity.type === 2) return hasContent ? "listening" : "listeningType";
  if (activity.type === 3) return hasContent ? "watching" : "watchingType";

  return hasContent ? "competing" : "competingType";
};