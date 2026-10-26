import { customActivityIdOf } from "@/shared/custom-activity";
import type { CurrentActivity, CustomActivitiesState, InstalledPresences } from "@/shared/types";

const DEFAULT_BADGE_COLOR = "#0891b2";
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const safeColor = (color: string | undefined): string => (color && HEX_COLOR.test(color) ? color : DEFAULT_BADGE_COLOR);

export const readableBadgeColor = (color: string): string => {
  const hex = color.length === 4 ? `#${[...color.slice(1)].map((digit) => digit.repeat(2)).join("")}` : color;
  const tint = [0, 0, 16];
  const channels = [1, 3, 5].map((offset, index) =>
    Math.round(Number.parseInt(hex.slice(offset, offset + 2), 16) * 0.8 + tint[index] * 0.2)
      .toString(16)
      .padStart(2, "0")
  );
  return `#${channels.join("")}`;
};

export const toolbarActivityColor = (activity: CurrentActivity, presences: InstalledPresences, customActivities: CustomActivitiesState): string => {
  const customId = customActivityIdOf(activity.slug);

  if (customId) {
    const image = customActivities.items.find((item) => item.id === customId)?.largeImage;
    return image?.kind === "icon" ? safeColor(image.color) : DEFAULT_BADGE_COLOR;
  }

  return safeColor(presences[activity.slug]?.metadata.color);
};

export const toolbarActivitySymbol = (type: number | undefined): string => {
  switch (type) {
    case 2:
      return "🎧";
    case 3:
      return "👀";
    case 5:
      return "🏆";
    default:
      return "🎮";
  }
};