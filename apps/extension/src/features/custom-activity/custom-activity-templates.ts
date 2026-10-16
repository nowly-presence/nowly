import type { Translate } from "@/hooks/i18n-provider";
import { emptyCustomActivityDraft } from "@/shared/custom-activity";
import type {
  CustomActivityDraft,
  CustomActivityIcon,
  CustomActivityType,
  CustomTimestamp,
} from "@/shared/types";

export const CUSTOM_ACTIVITY_TEMPLATE_IDS = [
  "study",
  "code",
  "game",
  "music",
  "watch",
  "stream",
  "sport",
  "travel",
  "break",
  "focus",
] as const;

export type CustomActivityTemplateId =
  (typeof CUSTOM_ACTIVITY_TEMPLATE_IDS)[number];

type Template = {
  icon: CustomActivityIcon;
  color: string;
  type: CustomActivityType;
  timestamp: CustomTimestamp;
};

const ELAPSED: CustomTimestamp = { mode: "elapsed" };

export const CUSTOM_ACTIVITY_TEMPLATES: Record<
  CustomActivityTemplateId,
  Template
> = {
  study: {
    icon: "graduation",
    color: "#5a6bb0",
    type: 0,
    timestamp: { mode: "countdown", minutes: 25 },
  },
  code: { icon: "code", color: "#3f7d6b", type: 0, timestamp: ELAPSED },
  game: { icon: "gamepad", color: "#7a5aa6", type: 0, timestamp: ELAPSED },
  music: { icon: "headphone", color: "#a85a74", type: 2, timestamp: ELAPSED },
  watch: { icon: "tv", color: "#2f6f8f", type: 3, timestamp: ELAPSED },
  stream: { icon: "camera", color: "#9a6a4a", type: 0, timestamp: ELAPSED },
  sport: {
    icon: "run",
    color: "#5f7f3f",
    type: 0,
    timestamp: { mode: "countdown", minutes: 45 },
  },
  travel: { icon: "plane", color: "#0891b2", type: 0, timestamp: ELAPSED },
  break: {
    icon: "coffee",
    color: "#8a7a3c",
    type: 0,
    timestamp: { mode: "countdown", minutes: 15 },
  },
  focus: {
    icon: "moon",
    color: "#4a5560",
    type: 0,
    timestamp: { mode: "countdown", minutes: 60 },
  },
};

export const isCustomActivityTemplateId = (
  value: string | undefined,
): value is CustomActivityTemplateId =>
  CUSTOM_ACTIVITY_TEMPLATE_IDS.some((id) => id === value);

export const templateText = (id: CustomActivityTemplateId, t: Translate) => ({
  name: t(`custom.template.${id}.name`),
  details: t(`custom.template.${id}.details`),
  state: t(`custom.template.${id}.state`),
});

export const draftFromTemplate = (
  id: CustomActivityTemplateId,
  t: Translate,
): CustomActivityDraft => {
  const template = CUSTOM_ACTIVITY_TEMPLATES[id];
  return {
    ...emptyCustomActivityDraft(),
    ...templateText(id, t),
    type: template.type,
    largeImage: { kind: "icon", icon: template.icon, color: template.color },
    timestamp: template.timestamp,
  };
};